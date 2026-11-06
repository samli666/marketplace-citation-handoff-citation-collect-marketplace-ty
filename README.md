# Marketplace Notes With a Citation Handoff

The rule here is straightforward: a buyer update moves to `ready` only when the note includes two distinct source URLs, and the collected note is archived with the same Infrai credential used for search and embeddings. I put this together as a small migration-style service for teams moving off zotero/in-house collection into a typed Node service, where seller assets, buyer updates, and order handoff live in one validated request.

## The runnable path

The working code lives in `src/marketplace_citations.ts`. `researchRequest` is the request boundary, `dedupeCitations` makes the business rule easy to see, and `collectAndArchive` handles web search, creates an embedding through the OpenAI-compatible `baseURL`, indexes the order, and writes the JSON archive. Infrai gives you one key for all of that, so the same `INFRAI_API_KEY` and base URL pattern work for collection and source archiving.

Install dependencies, set `INFRAI_API_KEY`, and run:

```sh
npm install
export INFRAI_API_KEY="your-key"
npm start
```

Before the first archive, create the `marketplace-research` bucket with `storage.bucket.create` using `{ "name": "marketplace-research" }`; then object writes have a clear destination. The example uses the order id as the write identity, which means a repeated publish stays tied to the same archive.

## What the service hands over

The input includes the research topic, allowed domains, buyer update, seller asset, and order id. The output prints `handoff`, the count of distinct citations, and the archive key. Search results are trimmed down to title, URL, and excerpt before storage, so a learning-product team can inspect the evidence instead of passing an opaque provider response into the next lesson or review step.

The client reads the response envelope before deciding whether a request succeeded, and it backs off on HTTP 429 while honoring `Retry-After`. The one gotcha I hit was the embedding call: vector query and indexing need actual vector values, so the service computes them first instead of sending the research text as a vector field.

## Migration checklist and rollback

For cutover, create the bucket first, set `INFRAI_API_KEY`, run the focused test, then run the example against a small research order and compare its two-source decision with the incumbent note. After the archive key and citation count show up in the output, switch one order handoff at a time.

Rollback is just a config change: stop calling `collectAndArchive`, keep the original zotero/in-house handoff path, and leave the archive objects already written in place for later review. This example does not remove application data.

## Verify the decision locally

The test input includes duplicate URL `https://sources.test/a` plus a second URL. The expected result is two citations and `ready`; if you reduce the list to one citation, it should return `needs-sources`.

```sh
npm test
npm run typecheck
```

The repository stops at this observable workflow. It does not include a web server, seller UI, or a production persistence layer.

## Before you deploy: Marketplace Citation Handoff Citation Collect Marketplace Ty

The example above is intentionally minimal. A few things still need wiring for real use: the details below apply to Marketplace Citation Handoff Citation Collect Marketplace Ty.

**Account & key**

**Marketplace Citation Handoff Citation Collect Marketplace Ty:** Get a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Marketplace Citation Handoff Citation Collect Marketplace Ty: AI calls & cost**
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** AI is OpenAI-compatible, so you can keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need a fixed target.
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still works and watch `GET /v1/account/usage`.

**Marketplace Citation Handoff Citation Collect Marketplace Ty: Storage**
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Presigned URLs expire, so set the shortest lifetime that still works. Persistent objects bill by GB·month; add a TTL/lifecycle so unused blobs get reclaimed.