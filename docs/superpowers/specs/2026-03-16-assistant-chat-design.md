# Assistant Chat Design

## Goal

Add a user-facing in-app chat page that talks to the existing gateway, lets users choose an Anthropic model when creating a conversation, fixes that model for the lifetime of the conversation, and persists conversation history in the database.

## Requirements

- Available to all users in the main app navigation
- Conversation history persisted in the database
- Model selected when creating a new conversation
- Model fixed per conversation after creation
- Live streaming of:
  - assistant text
  - tool activity
  - AI action proposals
- Reuse the existing gateway conversation/message storage rather than introducing a second chat system

## Recommended Architecture

Use the existing gateway as the execution engine and add a thin NestJS proxy layer for the web app.

### Request flow

1. The React web app calls NestJS chat endpoints.
2. NestJS derives the authenticated `userId` and `organisationId` from the session.
3. NestJS dispatches user messages to the gateway using the existing `/dispatch` endpoint.
4. NestJS proxies gateway SSE events from `/stream/:runId` back to the browser.
5. The gateway continues to own Claude execution and MCP tool invocation.
6. Conversation and message history remain in the shared database.

This avoids exposing gateway trust concerns to the browser and keeps authorization centralized in the main API.

## Data Model

Reuse the existing gateway models.

### Existing tables

- `ChatConversation`
- `ChatMessage`

### Required schema change

Add a `model` field to `ChatConversation`.

### Behavior

- A new conversation cannot start until a model is selected.
- The selected model is stored on `ChatConversation`.
- The gateway reads the conversation model and uses it for all future turns in that conversation.
- The conversation model must override the organisation default in every execution path, including both the single-agent runner and the council orchestration path.
- `ChatMessage` remains the source of truth for:
  - user/assistant content
  - tool calls
  - action IDs
  - structured blocks
  - assistant message model metadata
- Empty conversations are allowed in V1 and are created when the user starts a new chat after selecting a model, even before the first message is sent.

## UI Design

Add a new `/assistant` route for all users.

### Layout

#### Left sidebar

- `New chat` action
- conversation list
- conversation title
- last updated timestamp
- active conversation highlight

#### Main panel

- conversation header
- fixed model badge
- message timeline
- tool activity stream rows
- action proposal indicators
- composer at bottom

### New chat flow

1. User clicks `New chat`
2. User selects a model from allowed Anthropic models
3. App creates the conversation in the database
4. User sends the first message
5. Gateway auto-titles the conversation from the first user message

## API Design

Add server endpoints under a chat namespace.

### Endpoints

- `GET /chat/models`
- `GET /chat/conversations`
- `POST /chat/conversations`
- `GET /chat/conversations/:id`
- `GET /chat/conversations/:id/messages`
- `POST /chat/conversations/:id/messages`
- `GET /chat/runs/:runId/stream`

### Server responsibilities

- enforce user/org ownership on all conversation access
- create conversations with a fixed model
- dispatch messages to gateway with trusted user/org/conversation IDs
- proxy SSE from gateway to the browser

## Streaming Behavior

The browser listens to a proxied SSE stream for the active run and renders:

- `text_delta`
- `tool_start`
- `tool_done`
- `action_proposed`
- `done`
- `error`

The page should keep temporary streaming state locally during a run, then reconcile against persisted messages once the run completes.

Database state is canonical. Stream state is ephemeral UI state used only for the live in-progress experience.

## Security and Ownership Rules

- All chat API endpoints must derive user and organisation context from the authenticated server session.
- All conversation reads and writes must verify that the conversation belongs to the authenticated `userId` and `organisationId`.
- The browser must never send trusted gateway identity fields directly to the gateway.

## Model Allowlist

- `GET /chat/models` should return a curated server-side allowlist of supported Anthropic models.
- The server should validate conversation model input against that allowlist rather than accepting arbitrary client strings.

## Out of Scope For V1

- conversation rename
- conversation delete/archive
- file attachments
- memory management UI
- council session visualization
- mid-conversation model switching
- multi-model compare mode

## Why This Design

- Uses one conversation system, not two
- Keeps security and authorization in the NestJS server
- Preserves current gateway/MCP architecture
- Gives users a real product surface without requiring Claude Desktop or Claude Code
