/**
 * BM25 (Best Match 25) — probabilistic information retrieval ranking function.
 *
 * BM25 is the ranking algorithm used by Elasticsearch, Apache Lucene, and Solr.
 * It improves on TF-IDF by normalising for document length and applying a
 * term-frequency saturation parameter (k1) so that repeated terms don't
 * indefinitely inflate scores.
 *
 * Parameters:
 *   k1 = 1.5  — controls term-frequency saturation (higher = less saturation)
 *   b  = 0.75 — controls document-length normalisation (1.0 = full normalisation)
 */

export interface Retrievable {
  body: string;
}

export class BM25<T extends Retrievable> {
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  private readonly tokenized: string[][];
  private readonly idf: Map<string, number>;
  private readonly avgdl: number;

  constructor(private readonly docs: T[]) {
    this.tokenized = docs.map((d) => BM25.tokenize(d.body));
    this.avgdl =
      this.tokenized.reduce((sum, d) => sum + d.length, 0) /
      Math.max(1, this.tokenized.length);
    this.idf = this.buildIdf();
  }

  static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private buildIdf(): Map<string, number> {
    const df = new Map<string, number>();
    for (const doc of this.tokenized) {
      for (const term of new Set(doc)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    const N = this.tokenized.length;
    const idf = new Map<string, number>();
    for (const [term, freq] of df) {
      // Robertson-Spärck Jones IDF with smoothing
      idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
    }
    return idf;
  }

  private scoreDoc(docIdx: number, queryTerms: string[]): number {
    const doc = this.tokenized[docIdx]!;
    const dl = doc.length;
    const tf = new Map<string, number>();
    for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);

    let score = 0;
    for (const term of queryTerms) {
      const f = tf.get(term) ?? 0;
      if (f === 0) continue;
      const idf = this.idf.get(term) ?? 0;
      // BM25 term score formula
      score +=
        idf *
        (f * (this.k1 + 1)) /
        (f + this.k1 * (1 - this.b + (this.b * dl) / this.avgdl));
    }
    return score;
  }

  /**
   * Retrieve the top-k documents most relevant to the query.
   * Returns an empty array if the corpus is empty.
   */
  retrieve(query: string, topK = 3): T[] {
    const queryTerms = BM25.tokenize(query);
    if (queryTerms.length === 0 || this.docs.length === 0) {
      return this.docs.slice(0, topK);
    }

    return this.docs
      .map((doc, i) => ({ doc, score: this.scoreDoc(i, queryTerms) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((x) => x.doc);
  }
}
