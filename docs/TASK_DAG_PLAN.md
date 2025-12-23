# Task DAG Plan

**Source:** Generated from `docs/INDEX.md`, `docs/GOAL.md`, and `docs/TASK_DAG_PROTOCOL.md`.

---

## [completed] Task ID: task-001 — Confirm product goal & scope boundaries

**Description:** Align on the Intent UI Mapping Prototype v0.1 goals, success criteria, and scope constraints before implementation planning proceeds.

**Dependencies:**
- None

**Sources:**
- [file] docs/GOAL.md
- [file] docs/INDEX.md

**Steps:**
- [completed] Identify required user outcomes, success metrics, and explicit exclusions.
- [completed] Extract scope boundaries and non-goals to inform later task scoping.
- [completed] Summarize stakeholder-facing statement of intent for plan alignment.

**Notes:**
- **Required user outcomes:** Users can submit text/files, receive intent clarification in a dedicated confirmation area (not the chat input), maintain a full interaction history, and curate a Meaning Index that maps phrases to definitions/sources.
- **Success metrics:** Intent clarification requests surface in the confirmation area, Meaning Index entries persist with sources, Task DAG tasks can be created/updated with dependencies, and the History panel logs all requests/replies/tool results.
- **Explicit exclusions/non-goals:** No traditional chatbot continuation in the input field; UI should not rely solely on chat for clarification; scope limited to v0.1 intent/meaning clarification and Task DAG planning capabilities.
- **Scope boundaries:** Frontend is Next.js with CopilotKit UI/hooks; backend agent is Pydantic AI using CopilotKit AG-UI protocol; primary UI components are Input Area, Meaning/Intent Confirmation Area, History Panel, and Meaning Index.
- **Stakeholder intent statement:** Deliver a v0.1 Intent UI Mapping Prototype that helps users clarify intent via a state-sensitive confirmation area, records all interactions in history, and maintains a Meaning Index and Task DAG for traceable planning.

---

## [completed] Task ID: task-002 — Enumerate CopilotKit architectural components in scope

**Description:** Catalog the frontend/backend components needed, including runtime, hooks, UI components, and agent integration model.

**Dependencies:**
- [required] task-001: Must align components to defined scope.

**Sources:**
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [completed] List frontend packages, hooks, and UI components needed.
- [completed] List backend runtime and agent integration components.
- [completed] Identify required communication protocol(s).

**Notes:**
- **Frontend packages:** `@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`, `@ag-ui/client`.
- **Frontend hooks:** `useCoAgent`, `useFrontendTool`, `useRenderToolCall`, `useHumanInTheLoop`, `useDefaultTool`, `useCopilotAction`, `useCopilotReadable`.
- **Frontend UI components:** `CopilotKit` provider, `CopilotSidebar` (optional `CopilotChat`/`CopilotPopup` for history panel or auxiliary chat UI), custom intent/meaning components wired to shared state.
- **Backend runtime/agent components:** PydanticAI `Agent`, `RunContext`, `StateDeps`, state models, `StateSnapshotEvent`/`EventType` for state sync, `agent.to_ag_ui()` to expose AG-UI-compatible FastAPI app, `uvicorn` to serve.
- **Protocol:** AG-UI over HTTP between Next.js `CopilotRuntime` API route and backend agent, using `HttpAgent` as the client adapter.

---

## [completed] Task ID: task-003 — Define shared state model & intent schema

**Description:** Specify the shared state structure and intent/meaning index schema that will be synchronized between UI and agent.

**Dependencies:**
- [required] task-001: Must match scope goals.
- [required] task-002: Must align with architectural components.

**Sources:**
- [file] docs/COPILOTKIT_HOOKS_STATE_REFERENCE.md
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [completed] Draft TypeScript state shape for UI.
- [completed] Draft Pydantic model for agent state.
- [completed] Ensure both match 1:1 and cover intent/meaning fields.

**Notes:**
- **Shared State (TypeScript/Pydantic parity):**
  - `IntentUIState`
    - `meaning_index`: `Record<string, MeaningEntry>` (keyed by normalized word/phrase)
    - `task_dag`: `Record<string, TaskNode>` (task nodes conform to `TASK_DAG_PROTOCOL.md`)
    - `intent_confirmation`: `{ status: "idle" | "needs_clarification" | "confirmed"; prompt: string; options?: string[]; context?: string; response?: string }`
    - `history`: `HistoryItem[]` (chronological tool/user/agent log)
  - `MeaningEntry`: `{ word_or_phrase: string; meaning: string; sources: string[]; context?: string; created_at?: string; updated_at?: string }`
  - `TaskNode`: `{ id: string; title: string; description: string; status: "pending" | "in_progress" | "completed" | "blocked" | "skipped"; steps?: Step[]; sources?: Source[]; dependencies?: Dependency[] }`
  - `HistoryItem`: `{ id: string; role: "user" | "assistant" | "tool"; content: string; timestamp: string; tool_name?: string }`
- **Intent fields are centralized** in `intent_confirmation` to keep the confirmation area decoupled from chat history.

---

## [completed] Task ID: task-004 — Map frontend CopilotKit hooks & state flows

**Description:** Identify which CopilotKit hooks handle state synchronization, UI rendering, and action execution.

**Dependencies:**
- [required] task-002: Hooks selection depends on component inventory.
- [required] task-003: Hooks depend on shared state shape.

**Sources:**
- [file] docs/COPILOTKIT_HOOKS_STATE_REFERENCE.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md

**Steps:**
- [completed] Select hooks for shared state sync (e.g., `useCoAgent`).
- [completed] Select hooks for tool rendering or frontend actions.
- [completed] Map where hooks are used in UI layout.

**Notes:**
- **State sync**: `useCoAgent<IntentUIState>` in main page/layout to bind shared state.
- **Frontend tools/actions**: `useFrontendTool` for UI-side updates (confirmation, meaning index highlights, history toggles).
- **Generative UI/tool rendering**: `useRenderToolCall` for tool result cards/log entries inside History Panel.
- **Human-in-the-loop**: `useHumanInTheLoop` for clarification flows that must pause for user response.
- **Readable context**: `useCopilotReadable` for exposing derived summaries (recent meanings, active clarification) to the agent.

---

## [completed] Task ID: task-005 — Define frontend action/tool surface

**Description:** Determine which UI-side tools/actions are exposed to the agent and how they mutate UI state.

**Dependencies:**
- [required] task-004: Depends on hook mapping.
- [required] task-003: Must align to state schema.

**Sources:**
- [file] docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [completed] Enumerate needed frontend actions (CRUD, confirmations, etc.).
- [completed] Define parameter schemas for each action.
- [completed] Link each action to UI state updates.

**Notes:**
- **Actions (useFrontendTool):**
  - `set_intent_confirmation(status, prompt, options?, context?)` → updates `intent_confirmation`.
  - `resolve_intent_confirmation(response)` → sets `intent_confirmation.response` + status `confirmed`.
  - `upsert_meaning_entry(word_or_phrase, meaning, sources, context?)` → insert/update `meaning_index`.
  - `remove_meaning_entry(word_or_phrase)` → delete from `meaning_index`.
  - `append_history_item(role, content, tool_name?)` → push to `history`.
  - `toggle_history_panel(open)` → local UI toggle (non-shared UI state).
- **Parameter schemas** mirror `IntentUIState` fields to keep agent alignment with UI updates.

---

## [completed] Task ID: task-006 — Define backend agent tools & state sync

**Description:** Identify agent-side tools required for reading/updating intent state, and define how state snapshots are emitted.

**Dependencies:**
- [required] task-003: Must use shared schema.
- [required] task-005: Ensure parity with frontend tool surface where needed.

**Sources:**
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [completed] Enumerate tools and classify read vs write operations.
- [completed] Define state snapshot events for each mutating tool.
- [completed] Confirm AG-UI protocol usage for communication.

**Notes:**
- **Read tools:** `get_task`, `get_all_tasks`, `get_meaning`, `search_meanings`, `get_state_summary`.
- **Write tools (must emit `StateSnapshotEvent`):**
  - Task DAG: `create_task`, `update_task_status`, `update_task`, `delete_task`
  - Meaning Index: `add_meaning`, `update_meaning`, `delete_meaning`
  - Clarification: `request_clarification` (triggers `useHumanInTheLoop`)
- **AG-UI protocol** is the transport between CopilotKit runtime and Pydantic AI agent via `HttpAgent`.

---

## [completed] Task ID: task-007 — Design UI layout & component usage

**Description:** Plan how the CopilotKit UI components are integrated into the UI layout for the intent mapping experience.

**Dependencies:**
- [required] task-002: Depends on UI component inventory.
- [required] task-004: Hooks placement influences UI layout.

**Sources:**
- [file] docs/COPILOTKIT_UI_RESEARCH.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md

**Steps:**
- [completed] Choose UI container (Sidebar, Popup, or Chat).
- [completed] Identify custom UI areas for intent mapping.
- [completed] Map component hierarchy for layout integration.

**Notes:**
- **History Panel**: `CopilotSidebar` as the scrollable chat history (opened via History button).
- **Main layout**:
  - **Input Area** (top): text input + file upload.
  - **Meaning/Intent Confirmation Area** (below input): state-sensitive card bound to `intent_confirmation`.
  - **Meaning Index Panel** (right/secondary column): list + details view.
- **Component hierarchy**:
  - `AppShell`
    - `CopilotKit` provider (global)
    - `MainColumn`
      - `InputArea`
      - `IntentConfirmationCard`
      - `HistoryButton`
    - `SideColumn`
      - `MeaningIndexPanel`
    - `CopilotSidebar` (History Panel)

---

## [completed] Task ID: task-008 — Draft runtime wiring (frontend ↔ backend)

**Description:** Plan Next.js runtime endpoint configuration and agent binding.

**Dependencies:**
- [required] task-002: Depends on runtime architecture.
- [required] task-006: Depends on agent tool plan.

**Sources:**
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [completed] Identify API route location and expected adapter.
- [completed] Define agent naming and runtime URL.
- [completed] Validate integration path with AG-UI protocol.

**Notes:**
- **API route**: `src/app/api/copilotkit/route.ts` using `copilotRuntimeNextJSAppRouterEndpoint`.
- **Runtime**: `CopilotRuntime` with `HttpAgent({ url: "http://localhost:8000/" })` (configurable via env var).
- **Agent name**: `intent_agent` (must match `useCoAgent` and backend agent name).
- **Protocol**: AG-UI over HTTP; `ExperimentalEmptyAdapter` for runtime adapter.

---

## [completed] Task ID: task-009 — Build task-to-UI workflow mapping

**Description:** Translate core user intent mapping steps into UI interactions and tool calls.

**Dependencies:**
- [required] task-001: Must align with goal flows.
- [required] task-005: Frontend actions must support interactions.
- [required] task-006: Backend tools must support agent actions.

**Sources:**
- [file] docs/GOAL.md
- [file] docs/IMPLEMENTATION_TASK_PLAN.md

**Steps:**
- [completed] Enumerate user flows for intent capture and clarification.
- [completed] Map each flow to frontend action/tool calls.
- [completed] Map agent responses to UI updates.

**Notes:**
- **Flow: Intent capture**
  - User submits input → history append → agent deduces intent.
- **Flow: Clarification**
  - Agent calls `request_clarification` → `IntentConfirmationCard` renders prompt/options → user responds → `resolve_intent_confirmation` → agent proceeds and updates meaning index/tasks.
- **Flow: Meaning Index CRUD**
  - Agent calls `add_meaning`/`update_meaning` → state snapshot updates → Meaning Index panel updates; frontend actions highlight entries.
- **Flow: Task DAG planning**
  - Agent calls `create_task`/`update_task_status` → state snapshot updates → Task list in UI refreshes.
- **Flow: History logging**
  - Tool calls render via `useRenderToolCall`, plus `append_history_item` for user/agent messages.

---

## [completed] Task ID: task-010 — Define validation & edge-case handling

**Description:** Plan how invalid inputs, ambiguous intent, or conflicting state will be handled in UI and agent.

**Dependencies:**
- [required] task-003: Requires schema to validate.
- [required] task-009: Must align with defined flows.

**Sources:**
- [file] docs/GOAL.md
- [file] docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md

**Steps:**
- [completed] Identify invalid/ambiguous input scenarios.
- [completed] Specify UI feedback and agent clarification behaviors.
- [completed] Define safe state rollback or correction patterns.

**Notes:**
- **Invalid/ambiguous scenarios**:
  - Empty/whitespace input, unsupported file types, unclear phrases, conflicting meanings, duplicate task IDs, cyclic dependencies.
- **UI feedback**:
  - Inline validation near input/upload; confirmation card shows clarification prompts; meaning entries highlight conflicts.
- **Agent behaviors**:
  - Use `request_clarification` when intent ambiguity or conflict is detected.
  - Reject cyclic Task DAG updates with explicit error messaging.
- **Rollback/correction**:
  - Invalid writes return no state snapshot; UI remains on last valid `IntentUIState`.
  - Confirmation responses can be cleared to return to `idle`.

---

## [completed] Task ID: task-011 — Establish implementation sequencing from DAG

**Description:** Convert the DAG into an execution order with dependency-aware sequencing, ensuring non-blocking tasks start early.

**Dependencies:**
- [required] task-001: Needs scope clarity.
- [required] task-002: Needs architecture inventory.
- [required] task-003: Needs schema foundation.

**Sources:**
- [file] docs/TASK_DAG_PROTOCOL.md
- [file] docs/IMPLEMENTATION_TASK_PLAN.md
- [file] docs/TASK_PLAN_VERIFICATION.md

**Steps:**
- [completed] Identify nodes with zero dependencies for earliest start.
- [completed] Group tasks into foundations → integration → UX flow.
- [completed] Mark any optional or soft dependencies.

**Notes:**
- **Zero-dependency roots**: `task-001`, `task-002` (already completed).
- **Sequencing**:
  1. **Foundation**: `task-003` (shared state schema).
  2. **State/Hook mapping**: `task-004`.
  3. **Tool surfaces**: `task-005` (frontend actions) + `task-006` (backend tools).
  4. **Integration**: `task-008` (runtime wiring).
  5. **UX layout & flows**: `task-007` (layout), `task-009` (workflow mapping), `task-010` (validation/edge cases).
  6. **Traceability**: `task-012` (checklist & mapping).
- **Optional/soft deps**: None identified; all dependencies are required for consistent state sync.

---

## [completed] Task ID: task-012 — Create implementation checklist & traceability map

**Description:** Provide a checklist that maps each task to source documentation and target files/components for clarity.

**Dependencies:**
- [required] task-011: Needs final sequencing.

**Sources:**
- [file] docs/INDEX.md
- [file] docs/IMPLEMENTATION_TASK_PLAN.md

**Steps:**
- [completed] Map each task to required files/modules.
- [completed] Associate tasks with documentation references.
- [completed] Identify any open questions requiring clarification.

**Notes:**
- **Checklist & traceability map**:
  - `task-003`: `src/lib/types/*`, `agent/src/models/*` (state schema) — refs: `GOAL.md`, `QUICK_REFERENCE.md`.
  - `task-004`: `src/app/page.tsx`, `src/components/*` (hooks placement) — refs: `COPILOTKIT_HOOKS_STATE_REFERENCE.md`.
  - `task-005`: `src/lib/actions/*`, `src/components/*` (frontend actions) — refs: `COPILOTKIT_ACTIONS_TOOLS_GUIDE.md`.
  - `task-006`: `agent/src/agent.py`, `agent/src/tools/*` (backend tools/state events) — refs: `COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md`.
  - `task-007`: `src/components/layout/*`, `src/components/history/*` (UI layout) — refs: `COPILOTKIT_UI_RESEARCH.md`, `GOAL.md`.
  - `task-008`: `src/app/api/copilotkit/route.ts`, `agent/src/main.py` (runtime wiring) — refs: `COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md`.
  - `task-009`: `src/components/intent-confirmation/*`, `src/components/history/*` (workflow UI) — refs: `GOAL.md`, `IMPLEMENTATION_TASK_PLAN.md`.
  - `task-010`: `agent/src/models/task_dag.py`, `src/components/forms/*` (validation) — refs: `GOAL.md`, `COPILOTKIT_ACTIONS_TOOLS_GUIDE.md`.
  - `task-011`: `docs/TASK_DAG_PLAN.md` (sequencing) — refs: `TASK_DAG_PROTOCOL.md`.
  - `task-012`: `docs/TASK_DAG_PLAN.md`, `docs/TASK_DAG_INDEX.md` (traceability) — refs: `INDEX.md`.
- **Open questions**:
  - Confirm whether History Panel logs live exclusively in shared state or also uses CopilotKit built-in chat transcript storage.
