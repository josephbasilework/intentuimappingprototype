# CopilotKit + Pydantic AI Quick Reference

Quick reference guide for implementing the Intent UI Mapping Prototype backend.

---

## Essential Imports

### Backend (Python)

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai.models.openai import OpenAIResponsesModel
```

### Frontend (TypeScript)

```typescript
import {
  useCoAgent,
  useFrontendTool,
  useRenderToolCall,
  useHumanInTheLoop,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime";
```

---

## Quick Setup Checklist

### Backend Setup

1. **Define State Model** (Pydantic)
   ```python
   class MyState(BaseModel):
       items: list[str] = Field(default_factory=list)
   ```

2. **Create Agent**
   ```python
   agent = Agent(
       model=OpenAIResponsesModel('gpt-4o-mini'),
       deps_type=StateDeps[MyState],
       system_prompt="Your agent instructions"
   )
   ```

3. **Add Tools**
   ```python
   @agent.tool
   async def my_tool(ctx: RunContext[StateDeps[MyState]]) -> StateSnapshotEvent:
       ctx.deps.state.items.append("new item")
       return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=ctx.deps.state)
   ```

4. **Create Server**
   ```python
   app = agent.to_ag_ui(deps=StateDeps(MyState()))
   uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
   ```

### Frontend Setup

1. **Create API Route** (`src/app/api/copilotkit/route.ts`)
   ```typescript
   const runtime = new CopilotRuntime({
     agents: {
       my_agent: new HttpAgent({ url: "http://localhost:8000/" }),
     },
   });
   ```

2. **Define Types** (must match backend)
   ```typescript
   export type MyState = {
     items: string[];
   }
   ```

3. **Use CoAgent Hook**
   ```typescript
   const { state, setState } = useCoAgent<MyState>({
     name: "my_agent",
     initialState: { items: [] },
   });
   ```

---

## Common Patterns

### Pattern 1: Read-Only Tool

```python
@agent.tool
def get_data(ctx: RunContext[StateDeps[MyState]]) -> list[str]:
    """Get current data."""
    return ctx.deps.state.items
```

### Pattern 2: State-Modifying Tool

```python
@agent.tool
async def add_item(ctx: RunContext[StateDeps[MyState]], item: str) -> StateSnapshotEvent:
    """Add an item."""
    ctx.deps.state.items.append(item)
    return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=ctx.deps.state)
```

### Pattern 3: Frontend Tool

```typescript
useFrontendTool({
  name: "doSomething",
  parameters: [{ name: "param", required: true }],
  handler({ param }) {
    console.log(param);
  },
});
```

### Pattern 4: Human-in-the-Loop

```typescript
useHumanInTheLoop({
  name: "confirm_action",
  render: ({ respond, status }) => (
    <ConfirmDialog
      onApprove={() => respond("approved")}
      onReject={() => respond("rejected")}
    />
  ),
});
```

### Pattern 5: Generative UI

```typescript
useRenderToolCall({
  name: "backend_tool_name",
  render: ({ args, result }) => <CustomComponent data={args} />,
});
```

---

## State Sync Rules

1. **Type Matching**: TypeScript types MUST exactly match Pydantic models
2. **State Updates**: Tools that modify state MUST return `StateSnapshotEvent`
3. **Automatic Sync**: State changes automatically propagate through AG-UI
4. **Frontend Updates**: `setState()` updates both local state and backend

---

## For Intent UI System

### Required State Models

```python
class Task(BaseModel):
    id: str
    description: str
    status: str
    dependencies: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)

class MeaningEntry(BaseModel):
    word_or_phrase: str
    meaning: str
    sources: list[str] = Field(default_factory=list)
    context: Optional[str] = None

class IntentUIState(BaseModel):
    task_dag: dict[str, Task] = Field(default_factory=dict)
    meaning_index: dict[str, MeaningEntry] = Field(default_factory=dict)
```

### Required Tools

**Task DAG**:
- `create_task(description, dependencies, sources, steps)` -> StateSnapshotEvent
- `get_tasks()` -> dict[str, Task]
- `update_task_status(task_id, status)` -> StateSnapshotEvent
- `delete_task(task_id)` -> StateSnapshotEvent

**Meaning Index**:
- `add_meaning(word_or_phrase, meaning, sources, context)` -> StateSnapshotEvent
- `get_meaning(word_or_phrase)` -> MeaningEntry
- `search_meanings(query)` -> list[MeaningEntry]
- `delete_meaning(word_or_phrase)` -> StateSnapshotEvent

**Clarification**:
- `request_clarification(question, options, context)` -> str (triggers Human-in-Loop)

---

## Debugging Tips

1. **Agent Not Responding**: Check agent is running on port 8000
2. **State Not Syncing**: Verify types match exactly
3. **Tool Not Found**: Check tool name in both frontend and backend
4. **Import Errors**: Run `cd agent && uv sync`
5. **Connection Refused**: Ensure both servers are running

---

## File Structure

```
project/
├── agent/
│   ├── src/
│   │   ├── main.py           # FastAPI entry point
│   │   └── agent.py          # Agent definition & tools
│   └── pyproject.toml        # Python dependencies
├── src/
│   ├── app/
│   │   ├── api/copilotkit/
│   │   │   └── route.ts      # CopilotRuntime endpoint
│   │   └── page.tsx          # Main UI with hooks
│   ├── components/           # React components
│   └── lib/
│       └── types.ts          # TypeScript types (match Pydantic)
└── docs/
    ├── GOAL.md               # Project requirements
    └── COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md  # Full guide
```

---

## Key Documentation Links

- Main Docs: https://docs.copilotkit.ai
- Pydantic AI: https://ai.pydantic.dev
- Shared State: https://docs.copilotkit.ai/pydantic-ai/shared-state
- Frontend Actions: https://docs.copilotkit.ai/pydantic-ai/frontend-actions
- Generative UI: https://docs.copilotkit.ai/pydantic-ai/generative-ui
- Human in Loop: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop

---

## Development Commands

```bash
# Install dependencies
npm install

# Start both servers
npm run dev

# Start individually
npm run dev:ui      # Frontend only (port 3000)
npm run dev:agent   # Backend only (port 8000)

# Debug mode
npm run dev:debug

# Reinstall Python deps
cd agent && uv sync
```

---

**Version**: 1.0
**Last Updated**: 2025-12-23
