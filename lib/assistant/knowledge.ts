// SERVER-ONLY. The legal corpus (data/legal, curated by the team's RAG work) and a small BM25 ranker used for both the
// corpus and the in-memory passages of verified case documents. No index is persisted: case plaintext never leaves memory.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { LegalRef } from "@/types/api";

interface CorpusLine { id: string; short_ref: string; title: string; text: string }

let corpus: LegalRef[] | null = null;
let corpusIndex: Bm25<LegalRef> | null = null;

/** The 42 curated summaries, loaded once. `ref` falls back to the id for the system-control entries (CTRL-*). */
export function legalCorpus(): LegalRef[] {
  if (!corpus) {
    const file = path.join(process.cwd(), "data", "legal", "rag_starter_corpus.jsonl");
    corpus = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l) as CorpusLine)
      .map((e) => ({ id: e.id, ref: e.short_ref || e.id, title: e.title, text: e.text }));
  }
  return corpus;
}

/** Looks entries up by id; an unknown id is a programming error, so it throws rather than silently dropping a citation. */
export function legal(...ids: string[]): LegalRef[] {
  const all = legalCorpus();
  return ids.map((id) => {
    const hit = all.find((e) => e.id === id);
    if (!hit) throw new Error(`legal corpus has no entry ${id}`);
    return hit;
  });
}

export function searchLegal(question: string, k = 3): LegalRef[] {
  corpusIndex ??= new Bm25(legalCorpus(), (e) => `${e.ref} ${e.title} ${e.text}`);
  return corpusIndex.search(question, k).map((h) => h.item);
}

// ───────────────────────────── tokenising
const STOP = new Set(("a an and are as at be by for from has have he her his i in is it its of on or she that the their them they this to was " +
  "were what when where which who whom why will with would does did do can could should there than then any all not no about into who's").split(" "));

/** Everyday words a judge or advocate types, mapped to the vocabulary the statutes and summaries use. */
const SYNONYMS: Record<string, string[]> = {
  cctv: ["electronic", "video", "record"], footage: ["electronic", "video", "record"], video: ["electronic", "audio"],
  phone: ["electronic", "mobile"], mobile: ["electronic", "phone"], whatsapp: ["electronic", "message"], email: ["electronic"],
  "65b": ["63", "certificate", "electronic"], certificate: ["63", "admissibility"], admissible: ["admissibility", "evidence"],
  fir: ["information", "cognizable", "first"], chargesheet: ["report", "completion", "investigation"], charge: ["report", "completion"],
  confession: ["confessions", "magistrate"], confess: ["confession", "confessions"], witness: ["witnesses", "statement", "examination"],
  seized: ["seizure", "search"], seizure: ["search", "recording"], recovered: ["seizure", "recovery"],
  vehicle: ["motorcycle", "bike", "car", "scooter", "truck", "auto", "rickshaw", "van"], weapon: ["knife", "gun", "pistol", "rod", "stick"],
  scene: ["place", "occurrence", "spot"], seen: ["saw", "noticed"], time: ["hrs", "date"],
  accused: ["suspect", "suspects"], victim: ["complainant", "injured"], stolen: ["theft", "snatched", "missing"],
  tamper: ["tampering", "integrity"], tampered: ["tampering", "integrity"], custody: ["chain", "custody"], privacy: ["personal", "data"],
};

const stem = (w: string) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

export function tokens(text: string, expand = false): string[] {
  const words = text.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2 && !STOP.has(w));
  const out = words.map(stem);
  if (expand) for (const w of words) out.push(...(SYNONYMS[w] ?? []).map(stem));
  return out;
}

// ───────────────────────────── BM25 (k1 = 1.2, b = 0.75)
export interface Hit<T> { item: T; score: number }

export class Bm25<T> {
  private docs: { item: T; tf: Map<string, number>; len: number }[];
  private df = new Map<string, number>();
  private avg: number;

  constructor(items: T[], text: (t: T) => string) {
    this.docs = items.map((item) => {
      const tf = new Map<string, number>();
      const ts = tokens(text(item));
      for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      return { item, tf, len: ts.length };
    });
    this.avg = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
  }

  search(query: string, k: number): Hit<T>[] {
    const q = [...new Set(tokens(query, true))];
    const n = this.docs.length;
    return this.docs.map((d) => {
      let score = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const df = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += idf * (f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * d.len / (this.avg || 1)));
      }
      return { item: d.item, score };
    }).filter((h) => h.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  }
}
