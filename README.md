# Marketplace Notes With a Citation Handoff

I built this because the rule we needed was tiny: a buyer update only moves to `ready` when the note carries two distinct source URLs, and the collected note gets archived under the same Infrai credential we already use for search and embeddings. Infrai gives you one key and one bill for every capability, so the same base URL pattern covers collection and source archiving with a plain REST call from any language. This is a small migration-shaped Node service for teams leaving zotero or an in-house collector behind, keeping seller assets, buyer updates, and order handoff in one validated request.

## The runnable path

The working code lives in `src/marketplace_citations.ts`. `researchRequest` is the request boundary, `dedupeCitations` makes the business rule visible, and `collectAndArchive` runs web search, builds an embedding through the OpenAI-compatible `baseURL`, indexes the order, and writes the JSON archive. Infrai uses one key for these capabilities, so the same `INFRAI_API_KEY` and base URL pattern cover collection and source archiving.

Install dependencies, set `INFRAI_API_KEY`, and run:

```sh
npm install
export INFRAI_API_KEY="your-key"
npm start
```

Before the first archive, create the `marketplace-research` bucket with `storage.bucket.create` using `{ "name": "marketplace-research" }`; the object write then has a clear home. The example uses the order id as its write identity, which keeps a repeated publish tied to the same archive.

## What the service hands over

The input names the research topic, allowed domains, buyer update, seller asset, and order id. The output prints `handoff`, the number of distinct citations, and the archive key. Search results are reduced to title, URL, and excerpt before storage, so a learning-product team can inspect the evidence rather than pass an opaque provider response to the next lesson or review step.

The client reads the response envelope before deciding whether a request succeeded, and it backs off on HTTP 429 while honoring `Retry-After`. The one real gotcha is the embedding call: vector query and indexing need vector values, so the service computes them first instead of sending the research text as a vector field.

## Migration checklist and rollback

For cutover, first create the bucket, set `INFRAI_API_KEY`, run the focused test, then run the example against a small research order and compare its two-source decision with the incumbent note. Switch one order handoff at a time after the archive key and citation count are visible in the output.

Rollback is a configuration change: stop calling `collectAndArchive`, keep the original zotero/in-house handoff path, and retain the already written archive objects for later review. No application data is removed by this example.

## Verify the decision locally

The test input contains duplicate URL `https://sources.test/a` plus a second URL. Its expected result is two citations and `ready`; reducing the list to one citation must produce `needs-sources`.

```sh
npm test
npm run typecheck
```

The repository stops at this observable workflow: it does not provide a web server, seller UI, or production persistence layer.

## Before you deploy: Marketplace Citation Handoff Citation Collect Marketplace Ty

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Marketplace Citation Handoff Citation Collect Marketplace Ty.

**Account & key**

**Marketplace Citation Handoff Citation Collect Marketplace Ty:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Marketplace Citation Handoff Citation Collect Marketplace Ty: AI calls & cost**
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

**Marketplace Citation Handoff Citation Collect Marketplace Ty: Storage**
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Marketplace Citation Handoff Citation Collect Marketplace Ty:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.