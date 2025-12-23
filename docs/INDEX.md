# Intent UI Mapping Prototype - Documentation Index

**Last Updated:** 2025-12-23

This is the global index of all documentation for the Intent UI Mapping Prototype project. All referenced documents should be consulted when implementing features.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Documentation Files](#documentation-files)
3. [Quick Reference](#quick-reference)
4. [How to Use This Index](#how-to-use-this-index)

---

## Project Overview

This project implements a **User Intent/Meaning Clarification System** using CopilotKit with Pydantic AI. The system includes:

- **Meaning Index**: Maps words/phrases to meanings/sources
- **Task DAG**: Directed Acyclic Graph for organizing tasks
- **Intent Confirmation Area**: State-sensitive UI for clarifying user intent
- **History Panel**: Complete interaction log

---

## Documentation Files

### Core Project Documentation

| File | Description | Purpose |
|------|-------------|---------|
| [GOAL.md](./GOAL.md) | Project goals and requirements | Defines v0.1 features and UI components |
| [TASK_DAG_PROTOCOL.md](./TASK_DAG_PROTOCOL.md) | Task DAG protocol specification | Defines the structure and rules for task organization |
| [TASK_DAG_PLAN.md](./TASK_DAG_PLAN.md) | Task DAG plan | Canonical task plan following the protocol format |
| [TASK_DAG_INDEX.md](./TASK_DAG_INDEX.md) | Task DAG index | Task lookup table with status tracking |

### CopilotKit Documentation Indices

| File | Description | Key Topics |
|------|-------------|------------|
| [COPILOTKIT_DOCUMENTATION_INDEX.md](./COPILOTKIT_DOCUMENTATION_INDEX.md) | Core architecture and concepts | Packages, providers, setup, examples from codebase |
| [COPILOTKIT_UI_RESEARCH.md](./COPILOTKIT_UI_RESEARCH.md) | UI components research | CopilotChat, Sidebar, Popup, Textarea, custom UI |
| [COPILOTKIT_HOOKS_STATE_REFERENCE.md](./COPILOTKIT_HOOKS_STATE_REFERENCE.md) | Hooks and state management | useCoAgent, useCopilotReadable, state sync |
| [COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md](./COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md) | Pydantic AI backend integration | AG-UI protocol, CoAgents, tools, state management |
| [COPILOTKIT_ACTIONS_TOOLS_GUIDE.md](./COPILOTKIT_ACTIONS_TOOLS_GUIDE.md) | Actions and tools reference | Frontend actions, backend tools, CRUD patterns |

### Quick Reference

| File | Description |
|------|-------------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Condensed reference for common operations |

---

## Quick Reference

### Key Hooks (from CopilotKit)

| Hook | Purpose | Use Case |
|------|---------|----------|
| `useCoAgent` | Bidirectional state sync | Meaning Index, Task DAG state |
| `useHumanInTheLoop` | Pause agent for user input | Intent clarification |
| `useRenderToolCall` | Custom UI for tool results | Generative UI |
| `useFrontendTool` | Client-side tools | UI state manipulation |
| `useCopilotReadable` | Expose state to AI | Context sharing |

### Key Concepts

| Concept | Documentation | Description |
|---------|---------------|-------------|
| **Meaning Index** | [GOAL.md](./GOAL.md) | Word/phrase to meaning mapping |
| **Task DAG** | [TASK_DAG_PROTOCOL.md](./TASK_DAG_PROTOCOL.md) | Directed graph for task organization |
| **AG-UI Protocol** | [COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md](./COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md) | Agent-UI communication |
| **CoAgents** | [COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md](./COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md) | Pydantic AI agent integration |
| **State-Sensitive UI** | [COPILOTKIT_UI_RESEARCH.md](./COPILOTKIT_UI_RESEARCH.md) | AI-controlled UI rendering |

### External Documentation

| Resource | URL |
|----------|-----|
| CopilotKit Docs | https://docs.copilotkit.ai |
| Pydantic AI Docs | https://ai.pydantic.dev |
| AG-UI Protocol | https://docs.copilotkit.ai/pydantic-ai/ |

---

## How to Use This Index

### For Implementation Tasks

1. **Start with [GOAL.md](./GOAL.md)** - Understand what needs to be built
2. **Check [TASK_DAG_PROTOCOL.md](./TASK_DAG_PROTOCOL.md)** - Follow the task structure format
3. **Reference the relevant CopilotKit guide** based on what you're implementing:
   - UI components: [COPILOTKIT_UI_RESEARCH.md](./COPILOTKIT_UI_RESEARCH.md)
   - State management: [COPILOTKIT_HOOKS_STATE_REFERENCE.md](./COPILOTKIT_HOOKS_STATE_REFERENCE.md)
   - Backend tools: [COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md](./COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md)
   - Actions: [COPILOTKIT_ACTIONS_TOOLS_GUIDE.md](./COPILOTKIT_ACTIONS_TOOLS_GUIDE.md)

### For Creating Task Plans

1. **Reference this index** at the start of your plan
2. **Cite specific documentation** for each task
3. **Follow [TASK_DAG_PROTOCOL.md](./TASK_DAG_PROTOCOL.md)** format

### Document Relationships

```
INDEX.md (this file)
    ├── GOAL.md ─────────────────────> Project requirements
    ├── TASK_DAG_PROTOCOL.md ────────> Task structure rules
    │
    └── CopilotKit Guides
        ├── COPILOTKIT_DOCUMENTATION_INDEX.md ──> Architecture overview
        ├── COPILOTKIT_UI_RESEARCH.md ──────────> UI components
        ├── COPILOTKIT_HOOKS_STATE_REFERENCE.md > Hooks & state
        ├── COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md > Backend
        └── COPILOTKIT_ACTIONS_TOOLS_GUIDE.md ──> Actions/tools
```

---

## File Summaries

### GOAL.md
Defines the v0.1 Intent UI Mapping Prototype including:
- Input area with file upload
- Meaning/Intent confirmation area (NOT in chat)
- History panel with full interaction log
- Meaning Index for word/phrase definitions
- Task DAG for organizing tasks with dependencies

### TASK_DAG_PROTOCOL.md
Specifies the Task DAG structure:
- Node/Task definition with status, steps, sources
- Dependency rules and types (required, optional, soft)
- Markdown format for representing DAGs
- CRUD operations (create, read, update, delete)
- Validation rules

### COPILOTKIT_DOCUMENTATION_INDEX.md
Core CopilotKit architecture:
- Package structure (@copilotkit/react-core, react-ui, runtime)
- Provider setup and configuration
- State management patterns
- Examples from current codebase

### COPILOTKIT_UI_RESEARCH.md
UI component capabilities:
- CopilotChat, CopilotSidebar, CopilotPopup
- CopilotTextarea for AI-enhanced input
- Custom UI patterns without default chat
- State-responsive components

### COPILOTKIT_HOOKS_STATE_REFERENCE.md
Hooks and state management:
- useCoAgent for bidirectional state sync
- useCopilotReadable for exposing state
- useHumanInTheLoop for user confirmation
- useRenderToolCall for generative UI

### COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md
Backend integration with Pydantic AI:
- AG-UI protocol explanation
- Creating PydanticAI agents
- Tool definitions with StateSnapshotEvent
- Frontend-backend state synchronization
- Implementation patterns for Intent UI

### COPILOTKIT_ACTIONS_TOOLS_GUIDE.md
Actions and tools comprehensive guide:
- Frontend actions (useCopilotAction)
- Backend tools with LangGraph
- CRUD patterns for Task DAG
- Meaning Index operations
- User clarification flows

---

## Version History

| Date | Changes |
|------|---------|
| 2025-12-23 | Initial documentation index created |
| 2025-12-23 | Added Task DAG plan and index references |

---

*This index should be updated whenever new documentation is added to the project.*
