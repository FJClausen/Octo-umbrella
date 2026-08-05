// ---------------------------------------------------------------------------
// SHARED LEADERBOARD (optional)
//
// Fill these in to make the podium shared across phones. Leave them empty and
// the game still works exactly as before -- each device just keeps its own
// times, and nothing breaks.
//
// To set it up:
//   1. In your Supabase project, open the SQL editor and run the contents of
//      ../supabase/scores.sql (it creates the table and its access rules).
//   2. Project Settings -> API: copy the Project URL and the anon public key.
//   3. Paste them below, commit, push. That is the whole job.
//
// The anon key is meant to be public -- it is safe in a web page, and the
// table's rules only allow adding a score and reading the list.
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://rfmqyxhtmmuertjmlazs.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXF5eGh0bW11ZXJ0am1sYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTkzMDIsImV4cCI6MjEwMTUzNTMwMn0.3IWpbimcemu-2uXuSDRvtp5sY03qboMs_Me2KqNfRmw';
