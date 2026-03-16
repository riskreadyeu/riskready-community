# Assistant Chat Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-facing in-app assistant page with per-conversation fixed model selection, persisted database history, and live gateway stream rendering.

**Architecture:** The web app will talk only to new authenticated NestJS chat endpoints. NestJS will own authorization and proxy gateway dispatch/SSE, while the gateway and existing chat tables remain the execution and persistence layer. Conversation-level model selection will override organisation defaults in both single-agent and council execution paths.

**Tech Stack:** React 18 + Vite, NestJS 11, Prisma 5, Fastify gateway, SSE, Vitest, Node structural tests

---

## Chunk 1: Persisted Conversation Model

### Task 1: Add conversation-level model persistence

**Files:**
- Modify: `apps/server/prisma/schema/gateway.prisma`
- Test: `gateway/src/__tests__/conversation-model.test.ts`

- [ ] **Step 1: Write the failing test**

Create `gateway/src/__tests__/conversation-model.test.ts` covering the model resolution helper:
- conversation model wins over DB/org default
- DB/org default wins over env default when conversation model absent

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/conversation-model.test.ts`
Expected: FAIL because the helper or behavior does not exist yet

- [ ] **Step 3: Write minimal implementation**

Add `model String?` to `ChatConversation` and implement a small gateway helper for model resolution.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/conversation-model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/prisma/schema/gateway.prisma gateway/src/__tests__/conversation-model.test.ts gateway/src/agent/agent-runner.ts gateway/src/council/council-orchestrator.ts
git commit -m "feat(chat): persist conversation model"
```

## Chunk 2: Server Chat API

### Task 2: Add authenticated chat API surface

**Files:**
- Create: `apps/server/src/chat/chat.module.ts`
- Create: `apps/server/src/chat/chat.controller.ts`
- Create: `apps/server/src/chat/chat.service.ts`
- Create: `apps/server/src/chat/chat.dto.ts`
- Modify: `apps/server/src/app.module.ts`
- Modify: `apps/server/src/gateway-config/gateway-config.service.ts`
- Test: `apps/server/src/chat/chat.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/server/src/chat/chat.service.spec.ts` covering:
- conversation creation with validated model
- ownership-scoped conversation listing
- message send rejecting foreign conversation access

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/server && npm test -- --runInBand src/chat/chat.service.spec.ts`
Expected: FAIL because chat module/service does not exist

- [ ] **Step 3: Write minimal implementation**

Implement:
- curated model allowlist endpoint
- list/create/fetch conversations and messages
- gateway dispatch proxy
- SSE proxy endpoint
- ownership checks using authenticated user/org

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/server && npm test -- --runInBand src/chat/chat.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/chat apps/server/src/app.module.ts apps/server/src/gateway-config/gateway-config.service.ts
git commit -m "feat(chat): add authenticated chat api"
```

## Chunk 3: Web Assistant Page

### Task 3: Add assistant route, API client, and page shell

**Files:**
- Create: `apps/web/src/lib/chat-api.ts`
- Create: `apps/web/src/pages/AssistantPage.tsx`
- Create: `apps/web/src/routes/assistant-routes.tsx`
- Modify: `apps/web/src/routes/index.tsx`
- Modify: `apps/web/src/lib/navigation.ts`
- Modify: `apps/web/src/components/app-shell.tsx` (only if nav wiring needs it)
- Test: `apps/web/test/assistant-structure.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `apps/web/test/assistant-structure.test.mjs` covering:
- assistant routes registered
- navigation contains assistant entry
- page imports/use of chat API exist

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/web/test/assistant-structure.test.mjs`
Expected: FAIL because assistant route/page/client do not exist

- [ ] **Step 3: Write minimal implementation**

Build the initial page with:
- conversation list pane
- new chat action + model picker
- message area
- composer
- fixed model badge

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/web/test/assistant-structure.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/chat-api.ts apps/web/src/pages/AssistantPage.tsx apps/web/src/routes/assistant-routes.tsx apps/web/src/routes/index.tsx apps/web/src/lib/navigation.ts apps/web/test/assistant-structure.test.mjs
git commit -m "feat(chat): add assistant page shell"
```

## Chunk 4: Streaming UX

### Task 4: Render live stream events and reconcile persisted state

**Files:**
- Modify: `apps/web/src/pages/AssistantPage.tsx`
- Create: `apps/web/src/components/assistant/` (split into focused components if needed)
- Test: `apps/web/test/assistant-structure.test.mjs`

- [ ] **Step 1: Write the failing test**

Extend `apps/web/test/assistant-structure.test.mjs` to require:
- stream handling for run events
- rendering hooks/components for tool activity
- rendering hooks/components for action proposals

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/web/test/assistant-structure.test.mjs`
Expected: FAIL on missing stream/event handling structure

- [ ] **Step 3: Write minimal implementation**

Implement:
- SSE connect/disconnect lifecycle
- transient local streaming state
- final reconciliation against persisted messages after `done`
- inline tool/activity/action proposal rendering

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/web/test/assistant-structure.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/AssistantPage.tsx apps/web/src/components/assistant apps/web/test/assistant-structure.test.mjs
git commit -m "feat(chat): stream assistant events in ui"
```

## Chunk 5: Integration Verification

### Task 5: Verify end-to-end build and type safety

**Files:**
- Modify: `README.md` only if setup/docs changes become necessary

- [ ] **Step 1: Run gateway targeted tests**

Run: `cd gateway && npm test -- src/__tests__/conversation-model.test.ts`
Expected: PASS

- [ ] **Step 2: Run server targeted tests**

Run: `cd apps/server && npm test -- --runInBand src/chat/chat.service.spec.ts`
Expected: PASS

- [ ] **Step 3: Run web structural tests**

Run: `node --test apps/web/test/assistant-structure.test.mjs`
Expected: PASS

- [ ] **Step 4: Run web typecheck and build**

Run: `cd apps/web && npx tsc --noEmit --pretty false && npm run build`
Expected: PASS

- [ ] **Step 5: Run server build**

Run: `cd apps/server && npm run build`
Expected: PASS

- [ ] **Step 6: Commit final polish**

```bash
git add .
git commit -m "feat(chat): add in-app assistant experience"
```
