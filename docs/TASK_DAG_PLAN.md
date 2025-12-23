# Task DAG Plan

**Source:** Generated from `docs/INDEX.md`, `docs/GOAL.md`, and `docs/TASK_DAG_PROTOCOL.md`.

---

## [pending] Task ID: task-001 — Confirm product goal & scope boundaries

**Description:** Align on the Intent UI Mapping Prototype v0.1 goals, success criteria, and scope constraints before implementation planning proceeds.

**Dependencies:**
- None

**Sources:**
- [file] docs/GOAL.md
- [file] docs/INDEX.md

**Steps:**
- [pending] Identify required user outcomes, success metrics, and explicit exclusions.
- [pending] Extract scope boundaries and non-goals to inform later task scoping.
- [pending] Summarize stakeholder-facing statement of intent for plan alignment.

---

## [pending] Task ID: task-002 — Enumerate CopilotKit architectural components in scope

**Description:** Catalog the frontend/backend components needed, including runtime, hooks, UI components, and agent integration model.

**Dependencies:**
- [required] task-001: Must align components to defined scope.

**Sources:**
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [pending] List frontend packages, hooks, and UI components needed.
- [pending] List backend runtime and agent integration components.
- [pending] Identify required communication protocol(s).

---

## [pending] Task ID: task-003 — Define shared state model & intent schema

**Description:** Specify the shared state structure and intent/meaning index schema that will be synchronized between UI and agent.

**Dependencies:**
- [required] task-001: Must match scope goals.
- [required] task-002: Must align with architectural components.

**Sources:**
- [file] docs/COPILOTKIT_HOOKS_STATE_REFERENCE.md
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [pending] Draft TypeScript state shape for UI.
- [pending] Draft Pydantic model for agent state.
- [pending] Ensure both match 1:1 and cover intent/meaning fields.

---

## [pending] Task ID: task-004 — Map frontend CopilotKit hooks & state flows

**Description:** Identify which CopilotKit hooks handle state synchronization, UI rendering, and action execution.

**Dependencies:**
- [required] task-002: Hooks selection depends on component inventory.
- [required] task-003: Hooks depend on shared state shape.

**Sources:**
- [file] docs/COPILOTKIT_HOOKS_STATE_REFERENCE.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md

**Steps:**
- [pending] Select hooks for shared state sync (e.g., `useCoAgent`).
- [pending] Select hooks for tool rendering or frontend actions.
- [pending] Map where hooks are used in UI layout.

---

## [pending] Task ID: task-005 — Define frontend action/tool surface

**Description:** Determine which UI-side tools/actions are exposed to the agent and how they mutate UI state.

**Dependencies:**
- [required] task-004: Depends on hook mapping.
- [required] task-003: Must align to state schema.

**Sources:**
- [file] docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [pending] Enumerate needed frontend actions (CRUD, confirmations, etc.).
- [pending] Define parameter schemas for each action.
- [pending] Link each action to UI state updates.

---

## [pending] Task ID: task-006 — Define backend agent tools & state sync

**Description:** Identify agent-side tools required for reading/updating intent state, and define how state snapshots are emitted.

**Dependencies:**
- [required] task-003: Must use shared schema.
- [required] task-005: Ensure parity with frontend tool surface where needed.

**Sources:**
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [pending] Enumerate tools and classify read vs write operations.
- [pending] Define state snapshot events for each mutating tool.
- [pending] Confirm AG-UI protocol usage for communication.

---

## [pending] Task ID: task-007 — Design UI layout & component usage

**Description:** Plan how the CopilotKit UI components are integrated into the UI layout for the intent mapping experience.

**Dependencies:**
- [required] task-002: Depends on UI component inventory.
- [required] task-004: Hooks placement influences UI layout.

**Sources:**
- [file] docs/COPILOTKIT_UI_RESEARCH.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md

**Steps:**
- [pending] Choose UI container (Sidebar, Popup, or Chat).
- [pending] Identify custom UI areas for intent mapping.
- [pending] Map component hierarchy for layout integration.

---

## [pending] Task ID: task-008 — Draft runtime wiring (frontend ↔ backend)

**Description:** Plan Next.js runtime endpoint configuration and agent binding.

**Dependencies:**
- [required] task-002: Depends on runtime architecture.
- [required] task-006: Depends on agent tool plan.

**Sources:**
- [file] docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
- [file] docs/COPILOTKIT_DOCUMENTATION_INDEX.md
- [file] docs/QUICK_REFERENCE.md

**Steps:**
- [pending] Identify API route location and expected adapter.
- [pending] Define agent naming and runtime URL.
- [pending] Validate integration path with AG-UI protocol.

---

## [pending] Task ID: task-009 — Build task-to-UI workflow mapping

**Description:** Translate core user intent mapping steps into UI interactions and tool calls.

**Dependencies:**
- [required] task-001: Must align with goal flows.
- [required] task-005: Frontend actions must support interactions.
- [required] task-006: Backend tools must support agent actions.

**Sources:**
- [file] docs/GOAL.md
- [file] docs/IMPLEMENTATION_TASK_PLAN.md

**Steps:**
- [pending] Enumerate user flows for intent capture and clarification.
- [pending] Map each flow to frontend action/tool calls.
- [pending] Map agent responses to UI updates.

---

## [pending] Task ID: task-010 — Define validation & edge-case handling

**Description:** Plan how invalid inputs, ambiguous intent, or conflicting state will be handled in UI and agent.

**Dependencies:**
- [required] task-003: Requires schema to validate.
- [required] task-009: Must align with defined flows.

**Sources:**
- [file] docs/GOAL.md
- [file] docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md

**Steps:**
- [pending] Identify invalid/ambiguous input scenarios.
- [pending] Specify UI feedback and agent clarification behaviors.
- [pending] Define safe state rollback or correction patterns.

---

## [pending] Task ID: task-011 — Establish implementation sequencing from DAG

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
- [pending] Identify nodes with zero dependencies for earliest start.
- [pending] Group tasks into foundations → integration → UX flow.
- [pending] Mark any optional or soft dependencies.

---

## [pending] Task ID: task-012 — Create implementation checklist & traceability map

**Description:** Provide a checklist that maps each task to source documentation and target files/components for clarity.

**Dependencies:**
- [required] task-011: Needs final sequencing.

**Sources:**
- [file] docs/INDEX.md
- [file] docs/IMPLEMENTATION_TASK_PLAN.md

**Steps:**
- [pending] Map each task to required files/modules.
- [pending] Associate tasks with documentation references.
- [pending] Identify any open questions requiring clarification.
