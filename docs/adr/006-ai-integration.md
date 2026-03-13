# ADR 006 — AI Integration: OpenAI via Supabase Edge Function

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

TESSA, the AI assistant, needs to answer questions about the user's knowledge base. This requires:
1. Sending the user's message (and relevant context) to an AI model
2. Keeping the AI API key secret (never exposed to the browser)
3. Rate limiting to prevent abuse and control costs
4. Storing the conversation history in the database

## Decision

AI calls are proxied through the **`chat-with-tessa-secure` Supabase Edge Function**. The function:
1. Validates the user's Supabase JWT
2. Checks rate limits via the `usage_tracking` table
3. Forwards the message to the **OpenAI API**
4. Persists the assistant response as a `messages` row
5. Returns the response to the client

The `OPENAI_API_KEY` is stored as a Supabase Edge Function secret — it never appears in the client bundle.

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| Edge Function proxy | ✅ **Selected** | API key never hits the browser; server-side rate limiting; JWT validation |
| Direct OpenAI from client | Rejected | API key would be exposed in the browser bundle |
| Custom Node.js API server | Considered | Unnecessary operational overhead given Supabase Edge Functions |
| Anthropic Claude | Deferred | Supported by existing secret infrastructure; deferred to v0.4 |
| Local LLM (Ollama) | Considered | Better privacy; deferred due to infrastructure complexity |

## Consequences

- `OPENAI_API_KEY` is set as a Supabase secret: `supabase secrets set OPENAI_API_KEY=sk-...`
- Rate limiting state is stored in `usage_tracking` table (requires migration)
- `ExternalApiConfig.openAITimeout` (default: 60s) controls how long to wait for OpenAI
- If OpenAI is unavailable, users see a `SERVICE_UNAVAILABLE` error from TESSA; the rest of the app continues working
- `ANTHROPIC_API_KEY` and `GOOGLE_AI_API_KEY` are reserved in `.env.example` for future provider support
