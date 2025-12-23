# CopilotKit + Pydantic AI Integration Guide

**Comprehensive Index for Intent UI Mapping Prototype Backend**

Based on analysis of the CopilotKit-PydanticAI starter template and official documentation patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pydantic AI Integration](#pydantic-ai-integration)
4. [AG-UI Protocol](#ag-ui-protocol)
5. [CoAgents Functionality](#coagents-functionality)
6. [Tool Definitions & Capabilities](#tool-definitions--capabilities)
7. [State Management](#state-management)
8. [Frontend Integration](#frontend-integration)
9. [Implementation Patterns for Intent UI](#implementation-patterns-for-intent-ui)
10. [Key Resources](#key-resources)

---

## Overview

CopilotKit provides a framework for building AI-powered applications with Pydantic AI as the backend agent framework. The integration uses the **AG-UI protocol** to enable bidirectional communication between the Next.js frontend and Python backend agents.

### Key Components

- **Frontend**: Next.js with CopilotKit React components
- **Backend**: PydanticAI agents running on FastAPI/Uvicorn
- **Protocol**: AG-UI for agent-UI communication
- **State Sync**: Bidirectional state management between frontend and backend

### Documentation URLs

- Primary Documentation: https://docs.copilotkit.ai
- Pydantic AI Docs: https://ai.pydantic.dev
- Pydantic AI Integration: https://docs.copilotkit.ai/pydantic-ai/
- Shared State: https://docs.copilotkit.ai/pydantic-ai/shared-state
- Frontend Actions: https://docs.copilotkit.ai/pydantic-ai/frontend-actions
- Generative UI: https://docs.copilotkit.ai/pydantic-ai/generative-ui
- Human in the Loop: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop

---

## Architecture

### System Flow

```
User Input (Frontend)
    ↓
CopilotKit React Components
    ↓
CopilotRuntime (Next.js API Route)
    ↓
AG-UI Protocol (HTTP)
    ↓
PydanticAI Agent (FastAPI)
    ↓
Tools & State Management
    ↓
Response back through AG-UI
    ↓
Frontend Updates
```

### File Structure

```
project/
├── src/
│   ├── app/
│   │   ├── api/copilotkit/route.ts    # CopilotRuntime endpoint
│   │   └── page.tsx                   # Main UI with CopilotKit hooks
│   ├── components/                     # React components
│   └── lib/
│       └── types.ts                    # Shared types (must match agent state)
└── agent/
    ├── src/
    │   ├── main.py                     # FastAPI server entry point
    │   └── agent.py                    # PydanticAI agent definition
    └── pyproject.toml                  # Python dependencies
```

---

## Pydantic AI Integration

### Creating a PydanticAI Agent

**File: `agent/src/agent.py`**

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai.models.openai import OpenAIResponsesModel

# 1. Define State Model
class MyAgentState(BaseModel):
    """State that syncs between frontend and backend."""
    items: list[str] = Field(
        default_factory=list,
        description='List of items'
    )

# 2. Create Agent
agent = Agent(
    model=OpenAIResponsesModel('gpt-4o-mini'),
    deps_type=StateDeps[MyAgentState],
    system_prompt="""
        You are a helpful assistant.
        Use the available tools to manage state and perform actions.
    """.strip()
)

# 3. Define Tools (see Tools section below)
```

### Converting Agent to AG-UI App

**File: `agent/src/main.py`**

```python
from agent import MyAgentState, StateDeps, agent

# Convert agent to AG-UI compatible ASGI app
app = agent.to_ag_ui(deps=StateDeps(MyAgentState()))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### Dependencies

**File: `agent/pyproject.toml`**

```toml
[project]
requires-python = ">=3.12"
dependencies = [
    "uvicorn",                          # ASGI server
    "pydantic-ai-slim[ag-ui]",         # AG-UI integration
    "pydantic-ai-slim[openai]",        # OpenAI model support
    "python-dotenv",                    # Environment variables
    "logfire>=4.10.0",                 # Optional: logging
]
```

---

## AG-UI Protocol

### What is AG-UI?

AG-UI (Agent-UI) is the communication protocol that enables:
- Bidirectional state synchronization
- Tool call rendering on frontend
- Human-in-the-loop interactions
- Event streaming between agent and UI

### Backend: Exposing AG-UI Endpoint

The `agent.to_ag_ui()` method automatically creates a FastAPI application that:
- Handles AG-UI protocol requests
- Manages state synchronization
- Streams events to frontend
- Processes tool calls

### Frontend: Connecting to AG-UI

**File: `src/app/api/copilotkit/route.ts`**

```typescript
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";

// 1. Create service adapter (for multi-agent support)
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create CopilotRuntime with AG-UI agent
const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({
      url: "http://localhost:8000/"
    }),
  },
});

// 3. Create Next.js API route handler
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### AG-UI Events

The protocol uses events for communication:

- **`StateSnapshotEvent`**: Updates shared state
- **`ToolCallEvent`**: Executes tools
- **`HumanInLoopEvent`**: Requests user input
- **`MessageEvent`**: Text responses

---

## CoAgents Functionality

### What are CoAgents?

CoAgents are PydanticAI agents that integrate with CopilotKit's frontend using the AG-UI protocol. They enable:
- Shared state between frontend and backend
- Tool execution visibility
- Human-in-the-loop workflows
- Real-time collaboration

### Using CoAgents in Frontend

**File: `src/app/page.tsx`**

```typescript
import { useCoAgent } from "@copilotkit/react-core";
import { AgentState } from "@/lib/types";

function MyComponent() {
  const { state, setState } = useCoAgent<AgentState>({
    name: "my_agent",  // Must match agent name in runtime
    initialState: {
      items: [],
    },
  });

  // state is synced with backend agent
  // setState updates both frontend and backend

  return (
    <div>
      <h1>Items: {state.items.length}</h1>
      {state.items.map(item => <div key={item}>{item}</div>)}
    </div>
  );
}
```

### Type Safety

**File: `src/lib/types.ts`**

```typescript
// MUST match the Pydantic model in agent.py
export type AgentState = {
  items: string[];
}
```

**Critical**: The TypeScript type must exactly match the Pydantic model structure.

---

## Tool Definitions & Capabilities

### Backend Tools (PydanticAI)

Tools are Python functions decorated with `@agent.tool` that the agent can call.

#### 1. Read-Only Tools

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps

@agent.tool
def get_items(ctx: RunContext[StateDeps[MyAgentState]]) -> list[str]:
    """Get the current list of items."""
    return ctx.deps.state.items
```

#### 2. State-Modifying Tools

```python
from ag_ui.core import EventType, StateSnapshotEvent

@agent.tool
async def add_item(
    ctx: RunContext[StateDeps[MyAgentState]],
    item: str
) -> StateSnapshotEvent:
    """Add a new item to the list."""
    ctx.deps.state.items.append(item)

    # Return StateSnapshotEvent to sync state with frontend
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

@agent.tool
async def set_items(
    ctx: RunContext[StateDeps[MyAgentState]],
    items: list[str]
) -> StateSnapshotEvent:
    """Replace the entire list of items."""
    ctx.deps.state.items = items
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )
```

#### 3. Complex Tools with Parameters

```python
@agent.tool
def search_items(
    ctx: RunContext[StateDeps[MyAgentState]],
    query: str,
    case_sensitive: bool = False
) -> list[str]:
    """Search items by query string.

    Args:
        query: The search term
        case_sensitive: Whether search is case-sensitive
    """
    items = ctx.deps.state.items
    if not case_sensitive:
        query = query.lower()
        items = [item.lower() for item in items]

    return [item for item in items if query in item]
```

### Tool Capabilities

Tools can:
- Read and modify agent state
- Make external API calls
- Perform computations
- Access databases
- Return different data types
- Trigger frontend updates via StateSnapshotEvent

### Tool Design Patterns

1. **CRUD Operations**: Create, Read, Update, Delete tools for data
2. **Validation**: Check preconditions before state changes
3. **Atomic Operations**: Each tool does one thing well
4. **Descriptive Docstrings**: Help the LLM understand when to use the tool
5. **Type Hints**: Enable proper type checking and LLM parameter understanding

---

## State Management

### Shared State Architecture

State is synchronized between:
- **Backend**: Pydantic model in agent
- **Frontend**: TypeScript type in React

### State Flow

```
User Action (Frontend)
    ↓
setState() call
    ↓
AG-UI Protocol
    ↓
Agent Tool Execution
    ↓
StateSnapshotEvent
    ↓
AG-UI Protocol
    ↓
Frontend State Update
    ↓
React Re-render
```

### Backend State Updates

```python
# In any tool that modifies state:
@agent.tool
async def update_state(
    ctx: RunContext[StateDeps[MyAgentState]],
    new_value: str
) -> StateSnapshotEvent:
    # Modify state
    ctx.deps.state.some_field = new_value

    # Return snapshot to sync with frontend
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )
```

### Frontend State Updates

```typescript
// Direct state update (also syncs to backend)
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: { items: [] },
});

// This will sync to backend agent
setState({
  ...state,
  items: [...state.items, "new item"],
});
```

---

## Frontend Integration

### Core Hooks

#### 1. useCoAgent

Manages shared state with backend agent.

```typescript
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: { /* ... */ },
});
```

#### 2. useFrontendTool

Define tools that run only on frontend (no backend call).

```typescript
import { useFrontendTool } from "@copilotkit/react-core";

useFrontendTool({
  name: "setThemeColor",
  parameters: [
    {
      name: "themeColor",
      description: "The theme color to set",
      required: true,
    },
  ],
  handler({ themeColor }) {
    setThemeColor(themeColor);
  },
});
```

#### 3. useRenderToolCall

Render custom UI when a backend tool is called (Generative UI).

```typescript
import { useRenderToolCall } from "@copilotkit/react-core";

useRenderToolCall({
  name: "get_weather",  // Must match backend tool name
  description: "Get the weather for a given location.",
  parameters: [
    { name: "location", type: "string", required: true }
  ],
  render: ({ args, result }) => {
    return <WeatherCard location={args.location} />;
  },
}, [dependencies]);
```

#### 4. useHumanInTheLoop

Request human approval/input during agent execution.

```typescript
import { useHumanInTheLoop } from "@copilotkit/react-core";

useHumanInTheLoop({
  name: "go_to_moon",
  description: "Go to the moon on request.",
  render: ({ respond, status }) => {
    return (
      <ConfirmDialog
        onApprove={() => respond("Approved")}
        onReject={() => respond("Rejected")}
        status={status}
      />
    );
  },
}, [dependencies]);
```

Status values: `"inProgress" | "executing" | "complete"`

#### 5. useDefaultTool

Use default tool rendering (not used in example, but available).

### UI Components

#### CopilotSidebar

Main chat interface component.

```typescript
import { CopilotSidebar } from "@copilotkit/react-ui";

<CopilotSidebar
  disableSystemMessage={true}
  clickOutsideToClose={false}
  labels={{
    title: "Assistant",
    initial: "Hi! How can I help?",
  }}
  suggestions={[
    {
      title: "Example Action",
      message: "Do something interesting.",
    },
  ]}
>
  <YourMainContent />
</CopilotSidebar>
```

### Styling

```typescript
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";

<main
  style={{
    "--copilot-kit-primary-color": "#6366f1"
  } as CopilotKitCSSProperties}
>
  {/* CopilotKit components will use this color */}
</main>
```

---

## Implementation Patterns for Intent UI

Based on the project goals in `/docs/GOAL.md`, here's how to implement the Intent UI system using CopilotKit + Pydantic AI.

### 1. Task DAG Management

#### Backend State Model

```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"

class Task(BaseModel):
    id: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    dependencies: list[str] = Field(default_factory=list)  # IDs of tasks this depends on
    sources: list[str] = Field(default_factory=list)  # References to Meaning Index
    steps: list[str] = Field(default_factory=list)  # Multi-step tasks

class TaskDAG(BaseModel):
    tasks: dict[str, Task] = Field(default_factory=dict)

    def can_execute(self, task_id: str) -> bool:
        """Check if task's dependencies are complete."""
        task = self.tasks.get(task_id)
        if not task:
            return False
        return all(
            self.tasks.get(dep_id, Task()).status == TaskStatus.COMPLETED
            for dep_id in task.dependencies
        )
```

#### CRUD Tools for Task DAG

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import StateSnapshotEvent, EventType
import uuid

class IntentUIState(BaseModel):
    task_dag: TaskDAG = Field(default_factory=TaskDAG)
    meaning_index: dict[str, MeaningEntry] = Field(default_factory=dict)

agent = Agent(
    model=OpenAIResponsesModel('gpt-4o'),
    deps_type=StateDeps[IntentUIState],
    system_prompt="""
        You are an intent clarification assistant.
        Help users build task plans and clarify meanings.
        Always check dependencies before marking tasks complete.
    """
)

@agent.tool
async def create_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    description: str,
    dependencies: list[str] = [],
    sources: list[str] = [],
    steps: list[str] = []
) -> StateSnapshotEvent:
    """Create a new task in the DAG.

    Args:
        description: What the task does
        dependencies: List of task IDs this task depends on
        sources: References to meanings from the index
        steps: Breakdown of multi-step tasks
    """
    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        description=description,
        dependencies=dependencies,
        sources=sources,
        steps=steps
    )
    ctx.deps.state.task_dag.tasks[task_id] = task

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
def get_tasks(
    ctx: RunContext[StateDeps[IntentUIState]]
) -> dict[str, Task]:
    """Retrieve all tasks from the DAG."""
    return ctx.deps.state.task_dag.tasks

@agent.tool
async def update_task_status(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    status: TaskStatus
) -> StateSnapshotEvent:
    """Update a task's status. Validates dependencies first."""
    task = ctx.deps.state.task_dag.tasks.get(task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")

    # Check if dependencies are met
    if status == TaskStatus.IN_PROGRESS or status == TaskStatus.COMPLETED:
        if not ctx.deps.state.task_dag.can_execute(task_id):
            raise ValueError("Cannot update task: dependencies not complete")

    task.status = status

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
async def delete_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str
) -> StateSnapshotEvent:
    """Delete a task from the DAG."""
    if task_id in ctx.deps.state.task_dag.tasks:
        del ctx.deps.state.task_dag.tasks[task_id]

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
def get_executable_tasks(
    ctx: RunContext[StateDeps[IntentUIState]]
) -> list[Task]:
    """Get all tasks whose dependencies are met."""
    dag = ctx.deps.state.task_dag
    return [
        task for task_id, task in dag.tasks.items()
        if task.status == TaskStatus.PENDING and dag.can_execute(task_id)
    ]
```

### 2. Meaning Index Management

```python
from datetime import datetime

class MeaningEntry(BaseModel):
    word_or_phrase: str
    meaning: str
    sources: list[str] = Field(default_factory=list)  # Citations/references
    context: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

@agent.tool
async def add_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
    meaning: str,
    sources: list[str] = [],
    context: Optional[str] = None
) -> StateSnapshotEvent:
    """Add or update a meaning in the index.

    Args:
        word_or_phrase: The term to define
        meaning: The definition/meaning
        sources: Citations or references
        context: Additional context about usage
    """
    key = word_or_phrase.lower()

    if key in ctx.deps.state.meaning_index:
        # Update existing
        entry = ctx.deps.state.meaning_index[key]
        entry.meaning = meaning
        entry.sources = sources
        entry.context = context
        entry.updated_at = datetime.now()
    else:
        # Create new
        entry = MeaningEntry(
            word_or_phrase=word_or_phrase,
            meaning=meaning,
            sources=sources,
            context=context
        )
        ctx.deps.state.meaning_index[key] = entry

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
def get_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str
) -> Optional[MeaningEntry]:
    """Look up a meaning from the index."""
    return ctx.deps.state.meaning_index.get(word_or_phrase.lower())

@agent.tool
def search_meanings(
    ctx: RunContext[StateDeps[IntentUIState]],
    query: str
) -> list[MeaningEntry]:
    """Search for meanings containing the query."""
    query_lower = query.lower()
    return [
        entry for entry in ctx.deps.state.meaning_index.values()
        if query_lower in entry.word_or_phrase.lower()
        or query_lower in entry.meaning.lower()
    ]

@agent.tool
async def delete_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str
) -> StateSnapshotEvent:
    """Remove a meaning from the index."""
    key = word_or_phrase.lower()
    if key in ctx.deps.state.meaning_index:
        del ctx.deps.state.meaning_index[key]

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )
```

### 3. Intent Deduction & Clarification

```python
class ClarificationRequest(BaseModel):
    question: str
    options: Optional[list[str]] = None
    context: str

@agent.tool
async def request_clarification(
    ctx: RunContext[StateDeps[IntentUIState]],
    question: str,
    options: Optional[list[str]] = None,
    context: str = ""
) -> str:
    """Request clarification from the user.

    This will trigger a Human-in-the-Loop UI component.

    Args:
        question: The clarification question
        options: Optional list of choices
        context: Context about why clarification is needed
    """
    # This would integrate with useHumanInTheLoop on frontend
    # The agent execution pauses until user responds
    return "Waiting for user clarification..."

# System prompt should include:
system_prompt = """
You are an intelligent intent clarification assistant.

Your role:
1. Deduce user intent from their input
2. If intent is ambiguous, request clarification using the request_clarification tool
3. Update the Meaning Index with clarified terms
4. Build a Task DAG for complex requests
5. Always validate task dependencies before marking complete

When unsure about meaning:
- Use request_clarification to ask the user
- Add clarified meanings to the Meaning Index
- Reference meanings when creating tasks
"""
```

### 4. Frontend Implementation

#### Types

```typescript
// src/lib/types.ts
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
}

export type Task = {
  id: string;
  description: string;
  status: TaskStatus;
  dependencies: string[];
  sources: string[];
  steps: string[];
}

export type TaskDAG = {
  tasks: Record<string, Task>;
}

export type MeaningEntry = {
  word_or_phrase: string;
  meaning: string;
  sources: string[];
  context?: string;
  created_at: string;
  updated_at: string;
}

export type IntentUIState = {
  task_dag: TaskDAG;
  meaning_index: Record<string, MeaningEntry>;
}
```

#### Main UI Component

```typescript
// src/app/page.tsx
"use client";

import { useCoAgent, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { IntentUIState } from "@/lib/types";
import { TaskDAGView } from "@/components/task-dag";
import { MeaningIndexView } from "@/components/meaning-index";
import { ClarificationDialog } from "@/components/clarification";

export default function IntentUIPage() {
  const { state, setState } = useCoAgent<IntentUIState>({
    name: "intent_agent",
    initialState: {
      task_dag: { tasks: {} },
      meaning_index: {},
    },
  });

  // Human-in-the-loop for clarification
  useHumanInTheLoop({
    name: "request_clarification",
    description: "Request clarification from user",
    render: ({ args, respond, status }) => {
      return (
        <ClarificationDialog
          question={args.question}
          options={args.options}
          context={args.context}
          onRespond={respond}
          status={status}
        />
      );
    },
  });

  return (
    <CopilotSidebar
      labels={{
        title: "Intent Assistant",
        initial: "Hi! I'll help clarify your intent and plan tasks.",
      }}
    >
      <div className="grid grid-cols-2 gap-4 p-4">
        <TaskDAGView
          dag={state.task_dag}
          onUpdateTask={(taskId, updates) => {
            const updatedTasks = { ...state.task_dag.tasks };
            updatedTasks[taskId] = { ...updatedTasks[taskId], ...updates };
            setState({
              ...state,
              task_dag: { tasks: updatedTasks }
            });
          }}
        />
        <MeaningIndexView
          index={state.meaning_index}
          onUpdateMeaning={(key, entry) => {
            setState({
              ...state,
              meaning_index: {
                ...state.meaning_index,
                [key]: entry
              }
            });
          }}
        />
      </div>
    </CopilotSidebar>
  );
}
```

#### Custom Clarification Component

```typescript
// src/components/clarification.tsx
export function ClarificationDialog({
  question,
  options,
  context,
  onRespond,
  status
}) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    onRespond(answer);
  };

  if (status !== "executing") return null;

  return (
    <div className="clarification-dialog">
      <h3>Clarification Needed</h3>
      <p className="context">{context}</p>
      <p className="question">{question}</p>

      {options ? (
        <div className="options">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                setAnswer(opt);
                onRespond(opt);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="free-text">
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer..."
          />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}
```

### 5. File Upload & MCP Integration

For file uploads and MCP server integration, you'll need to extend the system:

```python
@agent.tool
async def process_uploaded_file(
    ctx: RunContext[StateDeps[IntentUIState]],
    file_path: str,
    labels: list[str] = []
) -> str:
    """Process an uploaded file and extract intent.

    Args:
        file_path: Path to the uploaded file
        labels: Optional labels/tags for the file
    """
    # Read and process file
    # Extract meanings and create tasks
    # Return summary
    pass
```

Frontend file upload:

```typescript
// Can use CopilotKit's file attachment features
// or custom upload with useFrontendTool
```

---

## Key Resources

### Official Documentation

- **CopilotKit Documentation**: https://docs.copilotkit.ai
- **Pydantic AI Documentation**: https://ai.pydantic.dev
- **AG-UI Protocol**: https://docs.copilotkit.ai/pydantic-ai/
- **CoAgents Guide**: https://docs.copilotkit.ai/pydantic-ai/shared-state
- **Tool Rendering**: https://docs.copilotkit.ai/pydantic-ai/generative-ui
- **Human in Loop**: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop
- **Frontend Actions**: https://docs.copilotkit.ai/pydantic-ai/frontend-actions

### Code Examples

- **Starter Template**: This project is based on the official CopilotKit-PydanticAI starter
- **Example Agent**: `/agent/src/agent.py`
- **Example Frontend**: `/src/app/page.tsx`

### Package Versions (from this project)

- **Frontend**:
  - `@copilotkit/react-core`: 1.50.0
  - `@copilotkit/react-ui`: 1.50.0
  - `@copilotkit/runtime`: 1.50.0
  - `@ag-ui/client`: ^0.0.42

- **Backend**:
  - `pydantic-ai-slim[ag-ui]`: Latest
  - `pydantic-ai-slim[openai]`: Latest
  - Python: >=3.12

### Development Workflow

1. **Start Both Servers**:
   ```bash
   npm run dev  # Starts both UI (port 3000) and agent (port 8000)
   ```

2. **Debug Mode**:
   ```bash
   npm run dev:debug  # Enable debug logging
   ```

3. **Separate Servers**:
   ```bash
   npm run dev:ui     # Frontend only
   npm run dev:agent  # Backend only
   ```

### Troubleshooting

- **Connection Issues**: Ensure agent is running on port 8000
- **State Sync Issues**: Verify TypeScript types match Pydantic models exactly
- **Tool Not Found**: Check tool name matches between frontend and backend
- **Import Errors**: Run `cd agent && uv sync` to reinstall Python deps

---

## Summary

### For Intent UI Prototype Needs:

1. **Intent Deduction**: Use agent's system prompt and tools to analyze user input
2. **Task DAG CRUD**: Implement tools for create/read/update/delete operations on tasks
3. **Meaning Index CRUD**: Similar tools for managing word/meaning mappings
4. **Clarification**: Use `useHumanInTheLoop` hook for user confirmation
5. **State Sync**: All state automatically syncs between frontend and backend via AG-UI
6. **History**: Use CopilotKit's built-in message history or implement custom logging

### Critical Patterns:

- Tools that modify state MUST return `StateSnapshotEvent`
- TypeScript types MUST exactly match Pydantic models
- Use `StateDeps[YourState]` as the agent's deps_type
- Frontend hooks must reference correct agent name
- All async operations use AG-UI protocol for communication

### Next Steps:

1. Define complete state models for Task DAG and Meaning Index
2. Implement CRUD tools for both systems
3. Create frontend components for visualization
4. Add file upload handling
5. Integrate MCP server support
6. Build custom History panel UI
7. Style the clarification area separately from chat

---

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Based On**: CopilotKit 1.50.0 + PydanticAI AG-UI Integration
