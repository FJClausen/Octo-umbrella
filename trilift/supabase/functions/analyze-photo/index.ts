import Anthropic from 'npm:@anthropic-ai/sdk@0.122.0';

import { HttpError, adminClient, json, requireEnv, requireUser, serveJson } from '../_shared/utils.ts';

const MODEL = 'claude-opus-5';
const BUCKET = 'progress-photos';

const SYSTEM = `You are helping a trained endurance athlete read their own progress photos.

You are looking for relative muscular development and symmetry, and turning that
into a training emphasis suggestion for the next 4-6 week block.

Hard rules:
- This is directional guidance from a photograph, not a measurement. Lighting,
  pose, camera angle, pump and time of day move apparent size far more than a
  training block does. Say so when the photos differ in those respects.
- Do not estimate body-fat percentage, weight, or any other number from the image.
- Do not comment on appearance, attractiveness, or anything health-diagnostic.
- Stay with what a coach would say: which areas look under-developed relative to
  the rest, and what to emphasise.
- The athlete's programme is three full-body strength sessions a week with
  dumbbells, plus cycling and swimming. Running is excluded for an Achilles
  issue, and every session already includes heavy slow calf raises. Keep
  suggestions inside that structure.

Reply with JSON only, no prose around it, in exactly this shape:
{
  "summary": "two or three sentences, plain and encouraging",
  "emphasis": [
    { "area": "e.g. Posterior chain", "note": "what to add or prioritise, one sentence" }
  ]
}
Give between one and three emphasis entries.`;

type ImagePart = { media_type: string; data: string; label: string };

/** Downloads a photo from private storage and base64-encodes it for the API. */
async function loadPhoto(
  admin: ReturnType<typeof adminClient>,
  path: string,
  label: string,
): Promise<ImagePart> {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) throw new HttpError(404, `Could not read the photo: ${error?.message}`);

  const bytes = new Uint8Array(await data.arrayBuffer());

  // Chunked so a large photo cannot blow the argument limit of String.fromCharCode.
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  return {
    media_type: data.type && data.type.startsWith('image/') ? data.type : 'image/jpeg',
    data: btoa(binary),
    label,
  };
}

Deno.serve(
  serveJson(async (req) => {
    const user = await requireUser(req);
    const admin = adminClient();
    const body = await req.json().catch(() => ({}));

    if (!body.body_log_id) throw new HttpError(400, 'Missing body_log_id');

    // Scoped to this user, so one id can never reach another account's photo.
    const { data: target, error: targetError } = await admin
      .from('body_logs')
      .select('id, logged_on, photo_path')
      .eq('user_id', user.id)
      .eq('id', body.body_log_id)
      .maybeSingle();

    if (targetError) throw new HttpError(500, targetError.message);
    if (!target?.photo_path) throw new HttpError(400, 'That check-in has no photo attached');

    // The most recent earlier photo, so the model has something to compare to.
    const { data: earlier } = await admin
      .from('body_logs')
      .select('logged_on, photo_path')
      .eq('user_id', user.id)
      .not('photo_path', 'is', null)
      .lt('logged_on', target.logged_on)
      .order('logged_on', { ascending: false })
      .limit(1)
      .maybeSingle();

    const images: ImagePart[] = [];
    if (earlier?.photo_path) {
      images.push(await loadPhoto(admin, earlier.photo_path, `Earlier photo — ${earlier.logged_on}`));
    }
    images.push(await loadPhoto(admin, target.photo_path, `Latest photo — ${target.logged_on}`));

    const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      messages: [
        {
          role: 'user',
          content: [
            ...images.flatMap((image) => [
              { type: 'text' as const, text: image.label },
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: image.media_type as 'image/jpeg',
                  data: image.data,
                },
              },
            ]),
            {
              type: 'text' as const,
              text:
                images.length > 1
                  ? 'Compare these two photos and suggest where to put the emphasis next block.'
                  : 'This is the first photo, so there is nothing to compare against yet. Read it on its own and suggest where to put the emphasis next block.',
            },
          ],
        },
      ],
    });

    if (message.stop_reason === 'refusal') {
      throw new HttpError(422, 'The model declined to analyse this photo.');
    }

    const text = message.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    // Be forgiving about a stray code fence around the JSON.
    const parsed = safeParse(text);
    if (!parsed) throw new HttpError(502, 'The model did not return usable JSON.');

    const { data: saved, error: saveError } = await admin
      .from('photo_analyses')
      .insert({
        user_id: user.id,
        body_log_id: target.id,
        model: MODEL,
        summary: parsed.summary ?? null,
        emphasis: Array.isArray(parsed.emphasis) ? parsed.emphasis : [],
      })
      .select()
      .single();

    if (saveError) throw new HttpError(500, saveError.message);
    return json(saved);
  }),
);

function safeParse(text: string): { summary?: string; emphasis?: unknown } | null {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
