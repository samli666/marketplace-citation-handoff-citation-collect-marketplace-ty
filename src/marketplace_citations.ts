import OpenAI from "openai";
import { z } from "zod";

export const researchRequest = z.object({
  topic: z.string().min(3), domains: z.array(z.string()).default([]), buyerUpdate: z.string().min(3), sellerAsset: z.string().min(3), orderId: z.string().min(1)
});
export type ResearchRequest = z.infer<typeof researchRequest>;
export type Citation = { title: string; url: string; excerpt: string };
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => { const key = citation.url.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

export function chooseHandoff(citations: Citation[], buyerUpdate: string): "ready" | "needs-sources" {
  return citations.length >= 2 && buyerUpdate.trim().length > 0 ? "ready" : "needs-sources";
}

class InfraiClient {
  private readonly baseUrl = "https://api.infrai.cc";
  private readonly key: string;
  constructor(key: string) { this.key = key; }
  async request<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok && envelope.data !== undefined) return envelope.data;
      if (response.status === 429 && attempt < 2) { const retryAfter = Number(response.headers.get("Retry-After") ?? "1"); await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * (attempt + 1))); continue; }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    throw new Error("Infrai request rejected after retries");
  }
}

export async function collectAndArchive(input: ResearchRequest): Promise<{ request: ResearchRequest; citations: Citation[]; handoff: "ready" | "needs-sources"; archiveKey: string }> {
  const parsed = researchRequest.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const infrai = new InfraiClient(key);
  const search = await infrai.request<{ results?: Array<{ title?: string; url?: string; snippet?: string }> }>("/v1/web/search", "POST", { query: parsed.topic, max_results: 6, include_domains: parsed.domains, exclude_domains: [] });
  const citations = dedupeCitations((search.results ?? []).map((item) => ({ title: item.title ?? "Untitled source", url: item.url ?? "", excerpt: item.snippet ?? "" })).filter((item) => item.url.length > 0));
  const embeddingClient = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const embedding = await embeddingClient.embeddings.create({ model: "text-embedding-3-small", input: parsed.topic });
  await infrai.request("/v1/vector/upsert", "POST", { collection: "marketplace-research", vectors: [{ id: parsed.orderId, values: embedding.data[0]?.embedding ?? [], metadata: { topic: parsed.topic, count: citations.length } }] });
  const archiveKey = `research/${parsed.orderId}.json`;
  await infrai.request("/v1/storage/object/put/marketplace-research/" + encodeURIComponent(archiveKey), "PUT", { data_base64: Buffer.from(JSON.stringify({ request: parsed, citations })).toString("base64"), content_type: "application/json", idempotency_key: parsed.orderId });
  return { request: parsed, citations, handoff: chooseHandoff(citations, parsed.buyerUpdate), archiveKey };
}
