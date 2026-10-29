import * as Print from 'expo-print';
import { splitSheet } from '../print/html';
import { addAnswerKey } from './answerKeys';
import { loadJson, saveJson } from './storage';

export interface PrinterSettings {
  name: string | null;
  url: string | null;
}

const KEY = 'printer-v1';
const EMPTY: PrinterSettings = { name: null, url: null };

export function loadPrinter(): Promise<PrinterSettings> {
  return loadJson(KEY, EMPTY);
}

/** iOS-only system picker; remembers the choice so later prints skip the dialog. */
export async function choosePrinter(): Promise<PrinterSettings> {
  const printer = await Print.selectPrinterAsync();
  const settings = { name: printer.name, url: printer.url };
  await saveJson(KEY, settings);
  return settings;
}

export async function forgetPrinter(): Promise<void> {
  await saveJson(KEY, EMPTY);
}

/**
 * One-tap print. With a saved printer URL iOS prints straight away with no dialog;
 * without one it falls back to the system print sheet. The answer key never prints:
 * it is kept in the app (parent area → Answer keys).
 */
export async function printHtml(html: string, opts: { keepAnswerKey?: boolean } = {}): Promise<'direct' | 'dialog'> {
  const { print, answers, title } = splitSheet(html);
  const { url } = await loadPrinter();
  if (url) await Print.printAsync({ html: print, printerUrl: url });
  else await Print.printAsync({ html: print });
  if (answers && opts.keepAnswerKey !== false) await addAnswerKey(title, answers);
  return url ? 'direct' : 'dialog';
}
