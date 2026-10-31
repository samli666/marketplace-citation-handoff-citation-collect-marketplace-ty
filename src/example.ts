import { collectAndArchive } from "./marketplace_citations.ts";

const result = await collectAndArchive({ topic: "how marketplace sellers describe delivery guarantees", domains: ["example.com"], buyerUpdate: "The buyer asked for two independent sources before review.", sellerAsset: "delivery guarantee comparison note", orderId: "demo-order-001" });
console.log(JSON.stringify({ handoff: result.handoff, citationCount: result.citations.length, archiveKey: result.archiveKey }, null, 2));
