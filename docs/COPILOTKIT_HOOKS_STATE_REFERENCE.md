# CopilotKit Hooks and State Management Reference

## Overview

This document provides a comprehensive reference for CopilotKit's React hooks and state management patterns, based on analysis of CopilotKit v1.50.0 implementation in this codebase and the official documentation structure.

**Official Documentation**: https://docs.copilotkit.ai

**Package Version**: 1.50.0 (from package.json)

---

## Table of Contents

1. [Core Setup](#core-setup)
2. [React Hooks Reference](#react-hooks-reference)
3. [State Management Patterns](#state-management-patterns)
4. [Frontend-Backend State Synchronization](#frontend-backend-state-synchronization)
5. [Implementation Examples](#implementation-examples)
6. [Application to Target System](#application-to-target-system)

---

## Core Setup

### Required Packages

```json
{
  "@copilotkit/react-core": "1.50.0",
  "@copilotkit/react-ui": "1.50.0",
  "@copilotkit/runtime": "1.50.0"
}
```

### Basic Configuration

#### 1. Root Layout Setup (`src/app/layout.tsx`)

```typescript
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

**Key Properties**:
- `runtimeUrl`: API endpoint for CopilotKit runtime
- `agent`: Name of the agent to connect to

#### 2. Runtime API Route (`src/app/api/copilotkit/route.ts`)

```typescript
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({ url: "http://localhost:8000/" }),
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

**Official Documentation**: https://docs.copilotkit.ai/pydantic-ai

---

## React Hooks Reference

### 1. `useCoAgent<TState>`

**Purpose**: Manages shared state between frontend and AI agent with bidirectional synchronization.

**Type Signature**:
```typescript
function useCoAgent<TState>(options: {
  name: string;
  initialState: TState;
}): {
  state: TState;
  setState: (state: TState) => void;
}
```

**Parameters**:
- `name`: Name of the agent (must match backend agent name)
- `initialState`: Initial state object

**Returns**:
- `state`: Current state object (read-only, updated by AI or frontend)
- `setState`: Function to update state from frontend

**Usage Example**:
```typescript
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: {
    proverbs: ["Initial proverb"],
  },
});
```

**Key Characteristics**:
- **Bidirectional sync**: AI can read and write, frontend can read and write
- **Reactive**: UI updates automatically when AI modifies state
- **Type-safe**: Full TypeScript support with generic type parameter

**Official Documentation**: https://docs.copilotkit.ai/pydantic-ai/shared-state

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 84-91)

---

### 2. `useFrontendTool`

**Purpose**: Exposes frontend actions/functions that the AI can call to modify UI state or trigger frontend behavior.

**Type Signature**:
```typescript
function useFrontendTool(options: {
  name: string;
  description?: string;
  parameters: Array<{
    name: string;
    description: string;
    type?: string;
    required?: boolean;
  }>;
  handler: (args: any) => void | Promise<void>;
}): void
```

**Parameters**:
- `name`: Tool name (what AI uses to invoke it)
- `description`: Optional description for AI context
- `parameters`: Array of parameter definitions
- `handler`: Function executed when AI calls the tool

**Usage Example**:
```typescript
useFrontendTool({
  name: "setThemeColor",
  parameters: [
    {
      name: "themeColor",
      description: "The theme color to set. Make sure to pick nice colors.",
      required: true,
    },
  ],
  handler({ themeColor }) {
    setThemeColor(themeColor);
  },
});
```

**Key Characteristics**:
- **AI-initiated**: AI decides when to call based on user intent
- **Frontend execution**: Runs in browser context
- **Direct state manipulation**: Can call React setState or other frontend functions
- **No return value needed**: Side effects only

**Official Documentation**: https://docs.copilotkit.ai/pydantic-ai/frontend-actions

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 21-33)

---

### 3. `useRenderToolCall`

**Purpose**: Renders custom UI components when AI executes specific tools (Generative UI pattern).

**Type Signature**:
```typescript
function useRenderToolCall(
  options: {
    name: string;
    description?: string;
    parameters?: Array<{
      name: string;
      type: string;
      required?: boolean;
    }>;
    render: (context: {
      args: any;
      result?: any;
      status?: string;
    }) => React.ReactNode;
  },
  dependencies?: any[]
): void
```

**Parameters**:
- `name`: Tool name to intercept
- `description`: Tool description for AI
- `parameters`: Tool parameter definitions
- `render`: Function returning React component
- `dependencies`: React dependency array (like useEffect)

**Usage Example**:
```typescript
useRenderToolCall(
  {
    name: "get_weather",
    description: "Get the weather for a given location.",
    parameters: [{ name: "location", type: "string", required: true }],
    render: ({ args, result }) => {
      return <WeatherCard location={args.location} themeColor={themeColor} />;
    },
  },
  [themeColor]
);
```

**Key Characteristics**:
- **Generative UI**: AI generates UI components dynamically
- **Tool interception**: Renders UI when specific tool is called
- **Access to args and results**: Full context from tool execution
- **Reactive**: Can depend on external state via dependencies array

**Official Documentation**: https://docs.copilotkit.ai/pydantic-ai/generative-ui

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 94-104)

---

### 4. `useHumanInTheLoop`

**Purpose**: Pauses AI execution to request human approval/input before proceeding.

**Type Signature**:
```typescript
function useHumanInTheLoop(
  options: {
    name: string;
    description?: string;
    render: (context: {
      respond: (response: string) => void;
      status: "inProgress" | "executing" | "complete";
    }) => React.ReactNode;
  },
  dependencies?: any[]
): void
```

**Parameters**:
- `name`: Action name that triggers human approval
- `description`: Description for AI context
- `render`: Function returning approval UI component
  - `respond`: Callback to send user's decision back to AI
  - `status`: Current state of the approval flow
- `dependencies`: React dependency array

**Usage Example**:
```typescript
useHumanInTheLoop(
  {
    name: "go_to_moon",
    description: "Go to the moon on request.",
    render: ({ respond, status }) => {
      return (
        <MoonCard
          themeColor={themeColor}
          status={status}
          respond={respond}
        />
      );
    },
  },
  [themeColor]
);
```

**Component Implementation** (`src/components/moon.tsx`):
```typescript
export function MoonCard({ themeColor, status, respond }: MoonCardProps) {
  const handleLaunch = () => {
    respond?.("You have permission to go to the moon.");
  };

  const handleAbort = () => {
    respond?.("You do not have permission to go to the moon.");
  };

  return (
    <div>
      {status === "executing" && (
        <>
          <button onClick={handleLaunch}>Launch!</button>
          <button onClick={handleAbort}>Abort</button>
        </>
      )}
    </div>
  );
}
```

**Key Characteristics**:
- **Blocking**: AI waits for user response
- **User control**: Human makes final decision
- **Status tracking**: UI can respond to different execution states
- **Text response**: User response is sent back to AI as text

**Official Documentation**: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop

**Implementation Files**:
- Hook: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 107-118)
- Component: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/components/moon.tsx`

---

### 5. `useDefaultTool`

**Purpose**: Registers default tools available to the agent (observed in imports but not used in example).

**Status**: Imported but not demonstrated in the current codebase.

**Type Signature** (inferred):
```typescript
function useDefaultTool(options: {
  name: string;
  description?: string;
  parameters?: ParameterDefinition[];
  handler: (args: any) => any | Promise<any>;
}): void
```

**Likely Use Case**: Similar to `useFrontendTool` but for registering tools that are always available to the agent.

**Implementation File**: Imported in `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (line 10) but not used.

---

### 6. UI Components

#### `CopilotSidebar`

**Purpose**: Renders a sidebar chat interface for interacting with the AI.

**Type Signature**:
```typescript
function CopilotSidebar(props: {
  disableSystemMessage?: boolean;
  clickOutsideToClose?: boolean;
  labels?: {
    title?: string;
    initial?: string;
  };
  suggestions?: Array<{
    title: string;
    message: string;
  }>;
  children?: React.ReactNode;
}): JSX.Element
```

**Usage Example**:
```typescript
<CopilotSidebar
  disableSystemMessage={true}
  clickOutsideToClose={false}
  labels={{
    title: "Popup Assistant",
    initial: "👋 Hi, there! You're chatting with an agent.",
  }}
  suggestions={[
    {
      title: "Generative UI",
      message: "Get the weather in San Francisco.",
    },
  ]}
>
  <YourMainContent />
</CopilotSidebar>
```

**Key Features**:
- Custom labels/branding
- Suggestion prompts for users
- Wraps main application content
- CSS custom properties for theming

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 41-78)

---

## State Management Patterns

### Pattern 1: Shared State with `useCoAgent`

**Architecture**:
```
Frontend (React) ←→ CopilotKit Runtime ←→ Backend Agent (PydanticAI)
     ↓                                              ↓
  useState                                    StateDeps[State]
     ↓                                              ↓
   state ←←←←←←←← Bidirectional Sync →→→→→→→→ ctx.deps.state
```

**Frontend Implementation**:
```typescript
// src/app/page.tsx
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: { proverbs: [] },
});

// UI can read and display state
{state.proverbs.map(proverb => <div>{proverb}</div>)}

// UI can write state
setState({ ...state, proverbs: [...state.proverbs, "New proverb"] });
```

**Backend Implementation** (`agent/src/agent.py`):
```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent

# Define state schema
class ProverbsState(BaseModel):
    proverbs: list[str] = Field(
        default_factory=list,
        description='The list of already written proverbs',
    )

# Create agent with state
agent = Agent(
    model=OpenAIResponsesModel('gpt-4.1-mini'),
    deps_type=StateDeps[ProverbsState],
)

# Tool to READ state
@agent.tool
def get_proverbs(ctx: RunContext[StateDeps[ProverbsState]]) -> list[str]:
    """Get the current list of proverbs."""
    return ctx.deps.state.proverbs

# Tool to WRITE state (append)
@agent.tool
async def add_proverbs(
    ctx: RunContext[StateDeps[ProverbsState]],
    proverbs: list[str]
) -> StateSnapshotEvent:
    ctx.deps.state.proverbs.extend(proverbs)
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

# Tool to WRITE state (replace)
@agent.tool
async def set_proverbs(
    ctx: RunContext[StateDeps[ProverbsState]],
    proverbs: list[str]
) -> StateSnapshotEvent:
    ctx.deps.state.proverbs = proverbs
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )
```

**State Synchronization Flow**:
1. **Frontend → Backend**: `setState()` triggers state update, syncs to backend
2. **Backend → Frontend**: Returning `StateSnapshotEvent` syncs state to frontend
3. **Backend reads**: `ctx.deps.state` always has current state
4. **Frontend reads**: `state` always has current state

**Key Points**:
- State schema must match between frontend TypeScript and backend Pydantic
- Use `StateSnapshotEvent` to push state changes from backend to frontend
- Both sides have full CRUD access to shared state
- State is automatically synchronized in real-time

**Implementation Files**:
- Frontend: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 84-91)
- Frontend Types: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/lib/types.ts`
- Backend: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/agent/src/agent.py`

---

### Pattern 2: Frontend-Only State with `useFrontendTool`

**Architecture**:
```
Frontend (React)
     ↓
  useState (local)
     ↓
AI can trigger updates via useFrontendTool
```

**Example**:
```typescript
const [themeColor, setThemeColor] = useState("#6366f1");

useFrontendTool({
  name: "setThemeColor",
  parameters: [{ name: "themeColor", description: "The theme color", required: true }],
  handler({ themeColor }) {
    setThemeColor(themeColor);  // Updates local React state
  },
});
```

**Key Points**:
- State is NOT shared with backend
- AI can trigger updates through tool calls
- Backend cannot read this state
- Useful for UI-only settings (theme, visibility, etc.)

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/app/page.tsx` (lines 18-33)

---

### Pattern 3: State-Sensitive UI with Direct State Binding

**Architecture**:
```typescript
function ProverbsCard({ state, setState }: ProverbsCardProps) {
  return (
    <div>
      {state.proverbs.map((proverb, index) => (
        <div key={index}>
          <p>{proverb}</p>
          <button onClick={() => setState({
            ...state,
            proverbs: state.proverbs.filter((_, i) => i !== index),
          })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Key Points**:
- UI directly bound to shared state
- User actions update state via `setState()`
- AI actions update state via backend tools
- Both trigger same UI updates
- UI is reactive to state changes from any source

**Implementation File**: `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/src/components/proverbs.tsx`

---

## Frontend-Backend State Synchronization

### State Update Flows

#### Flow 1: User Updates State
```
User clicks button
  ↓
setState({...}) in React
  ↓
CopilotKit syncs to backend
  ↓
ctx.deps.state updated in backend
  ↓
AI tools can now see new state
```

#### Flow 2: AI Updates State
```
AI decides to update state
  ↓
Calls @agent.tool function
  ↓
Modifies ctx.deps.state
  ↓
Returns StateSnapshotEvent
  ↓
CopilotKit syncs to frontend
  ↓
React state object updated
  ↓
UI re-renders automatically
```

#### Flow 3: AI Reads State
```
AI needs to know current state
  ↓
Calls @agent.tool with read access
  ↓
Reads ctx.deps.state.field
  ↓
Returns value to AI
  ↓
AI uses in reasoning/response
```

### State Snapshot Event

**Purpose**: Signals that backend state has changed and should sync to frontend.

**Implementation**:
```python
from ag_ui.core import EventType, StateSnapshotEvent

@agent.tool
async def update_state(ctx: RunContext[StateDeps[State]], new_data: str) -> StateSnapshotEvent:
    ctx.deps.state.data = new_data  # Modify state
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,  # Current state snapshot
    )
```

**Key Points**:
- Must return `StateSnapshotEvent` from tool to sync to frontend
- `snapshot` parameter contains the entire state object
- Frontend receives update and re-renders
- No manual sync code needed

---

## Implementation Examples

### Complete Example: CRUD Access Pattern

**TypeScript State Type** (`src/lib/types.ts`):
```typescript
export type AgentState = {
  proverbs: string[];
}
```

**Frontend Hook Usage** (`src/app/page.tsx`):
```typescript
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: { proverbs: [] },
});

// Component with CRUD operations
<ProverbsCard state={state} setState={setState} />
```

**Frontend Component** (`src/components/proverbs.tsx`):
```typescript
export function ProverbsCard({ state, setState }: ProverbsCardProps) {
  return (
    <div>
      {/* READ: Display all items */}
      {state.proverbs.map((proverb, index) => (
        <div key={index}>
          <p>{proverb}</p>
          {/* DELETE: Remove item */}
          <button onClick={() => setState({
            ...state,
            proverbs: state.proverbs.filter((_, i) => i !== index),
          })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Backend State Definition** (`agent/src/agent.py`):
```python
class ProverbsState(BaseModel):
    proverbs: list[str] = Field(default_factory=list)

agent = Agent(
    model=OpenAIResponsesModel('gpt-4.1-mini'),
    deps_type=StateDeps[ProverbsState],
)
```

**Backend CRUD Tools**:
```python
# READ
@agent.tool
def get_proverbs(ctx: RunContext[StateDeps[ProverbsState]]) -> list[str]:
    """Get the current list of proverbs."""
    return ctx.deps.state.proverbs

# CREATE (append)
@agent.tool
async def add_proverbs(
    ctx: RunContext[StateDeps[ProverbsState]],
    proverbs: list[str]
) -> StateSnapshotEvent:
    """Add new proverbs to the list."""
    ctx.deps.state.proverbs.extend(proverbs)
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

# UPDATE (replace all)
@agent.tool
async def set_proverbs(
    ctx: RunContext[StateDeps[ProverbsState]],
    proverbs: list[str]
) -> StateSnapshotEvent:
    """Replace the entire proverbs list."""
    ctx.deps.state.proverbs = proverbs
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

# DELETE (implicit - can be done via set_proverbs or frontend setState)
```

---

## Application to Target System

### Implementing Meaning Index

Based on the target system requirements from `/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md`:

#### State Schema

**TypeScript** (`src/lib/types.ts`):
```typescript
export type MeaningEntry = {
  id: string;
  word: string;
  phrase: string;
  meaning: string;
  sources: string[];  // Citations/references
  createdAt: string;
  updatedAt: string;
};

export type AgentState = {
  meaningIndex: MeaningEntry[];
}
```

**Python** (`agent/src/agent.py`):
```python
from pydantic import BaseModel, Field
from datetime import datetime

class MeaningEntry(BaseModel):
    id: str
    word: str
    phrase: str
    meaning: str
    sources: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str

class MeaningIndexState(BaseModel):
    meaning_index: list[MeaningEntry] = Field(default_factory=list)
```

#### CRUD Tools for Meaning Index

```python
@agent.tool
def get_meanings(ctx: RunContext[StateDeps[MeaningIndexState]]) -> list[MeaningEntry]:
    """Get all meanings from the index."""
    return ctx.deps.state.meaning_index

@agent.tool
def search_meanings(
    ctx: RunContext[StateDeps[MeaningIndexState]],
    query: str
) -> list[MeaningEntry]:
    """Search for meanings by word or phrase."""
    return [
        entry for entry in ctx.deps.state.meaning_index
        if query.lower() in entry.word.lower()
        or query.lower() in entry.phrase.lower()
    ]

@agent.tool
async def add_meaning(
    ctx: RunContext[StateDeps[MeaningIndexState]],
    word: str,
    phrase: str,
    meaning: str,
    sources: list[str]
) -> StateSnapshotEvent:
    """Add a new meaning to the index."""
    entry = MeaningEntry(
        id=str(len(ctx.deps.state.meaning_index) + 1),
        word=word,
        phrase=phrase,
        meaning=meaning,
        sources=sources,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
    )
    ctx.deps.state.meaning_index.append(entry)
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

@agent.tool
async def update_meaning(
    ctx: RunContext[StateDeps[MeaningIndexState]],
    id: str,
    word: str | None = None,
    phrase: str | None = None,
    meaning: str | None = None,
    sources: list[str] | None = None,
) -> StateSnapshotEvent:
    """Update an existing meaning entry."""
    for entry in ctx.deps.state.meaning_index:
        if entry.id == id:
            if word: entry.word = word
            if phrase: entry.phrase = phrase
            if meaning: entry.meaning = meaning
            if sources: entry.sources = sources
            entry.updated_at = datetime.now().isoformat()
            break
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

@agent.tool
async def delete_meaning(
    ctx: RunContext[StateDeps[MeaningIndexState]],
    id: str
) -> StateSnapshotEvent:
    """Delete a meaning from the index."""
    ctx.deps.state.meaning_index = [
        entry for entry in ctx.deps.state.meaning_index
        if entry.id != id
    ]
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )
```

#### Frontend UI Component

```typescript
function MeaningIndexPanel({ state, setState }: {
  state: AgentState;
  setState: (state: AgentState) => void;
}) {
  return (
    <div className="meaning-index-panel">
      <h2>Meaning Index</h2>
      {state.meaningIndex.map(entry => (
        <div key={entry.id} className="meaning-entry">
          <h3>{entry.word} / {entry.phrase}</h3>
          <p>{entry.meaning}</p>
          <div className="sources">
            {entry.sources.map((source, idx) => (
              <span key={idx}>{source}</span>
            ))}
          </div>
          <button onClick={() => {
            // Delete from frontend
            setState({
              ...state,
              meaningIndex: state.meaningIndex.filter(e => e.id !== entry.id)
            });
          }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

### Implementing Task DAG

#### State Schema

**TypeScript**:
```typescript
export type TaskNode = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  dependencies: string[];  // IDs of tasks this depends on
  sources: string[];  // References to Meaning Index entries
  createdAt: string;
  updatedAt: string;
};

export type AgentState = {
  meaningIndex: MeaningEntry[];
  taskDAG: TaskNode[];
}
```

**Python**:
```python
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskNode(BaseModel):
    id: str
    title: str
    description: str
    steps: list[str] = Field(default_factory=list)
    status: TaskStatus = TaskStatus.PENDING
    dependencies: list[str] = Field(default_factory=list)  # Task IDs
    sources: list[str] = Field(default_factory=list)  # Meaning Index IDs
    created_at: str
    updated_at: str

class SystemState(BaseModel):
    meaning_index: list[MeaningEntry] = Field(default_factory=list)
    task_dag: list[TaskNode] = Field(default_factory=list)
```

#### CRUD Tools for Task DAG

```python
@agent.tool
def get_tasks(ctx: RunContext[StateDeps[SystemState]]) -> list[TaskNode]:
    """Get all tasks from the DAG."""
    return ctx.deps.state.task_dag

@agent.tool
def get_ready_tasks(ctx: RunContext[StateDeps[SystemState]]) -> list[TaskNode]:
    """Get tasks that are ready to execute (all dependencies completed)."""
    completed_ids = {
        task.id for task in ctx.deps.state.task_dag
        if task.status == TaskStatus.COMPLETED
    }
    return [
        task for task in ctx.deps.state.task_dag
        if task.status == TaskStatus.PENDING
        and all(dep_id in completed_ids for dep_id in task.dependencies)
    ]

@agent.tool
async def add_task(
    ctx: RunContext[StateDeps[SystemState]],
    title: str,
    description: str,
    steps: list[str],
    dependencies: list[str] = [],
    sources: list[str] = [],
) -> StateSnapshotEvent:
    """Add a new task to the DAG."""
    # Validate dependencies exist
    existing_ids = {task.id for task in ctx.deps.state.task_dag}
    for dep_id in dependencies:
        if dep_id not in existing_ids:
            raise ValueError(f"Dependency {dep_id} does not exist")

    # Check for cycles (basic check - would need more robust algorithm)
    # ... cycle detection logic ...

    task = TaskNode(
        id=str(len(ctx.deps.state.task_dag) + 1),
        title=title,
        description=description,
        steps=steps,
        dependencies=dependencies,
        sources=sources,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
    )
    ctx.deps.state.task_dag.append(task)
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

@agent.tool
async def update_task_status(
    ctx: RunContext[StateDeps[SystemState]],
    id: str,
    status: TaskStatus,
) -> StateSnapshotEvent:
    """Update a task's status."""
    for task in ctx.deps.state.task_dag:
        if task.id == id:
            task.status = status
            task.updated_at = datetime.now().isoformat()
            break
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )

@agent.tool
async def delete_task(
    ctx: RunContext[StateDeps[SystemState]],
    id: str,
) -> StateSnapshotEvent:
    """Delete a task from the DAG."""
    # Check if any tasks depend on this one
    for task in ctx.deps.state.task_dag:
        if id in task.dependencies:
            raise ValueError(f"Cannot delete task {id}: task {task.id} depends on it")

    ctx.deps.state.task_dag = [
        task for task in ctx.deps.state.task_dag
        if task.id != id
    ]
    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state,
    )
```

#### Frontend DAG Visualization Component

```typescript
function TaskDAGPanel({ state, setState }: {
  state: AgentState;
  setState: (state: AgentState) => void;
}) {
  const getTaskById = (id: string) =>
    state.taskDAG.find(task => task.id === id);

  return (
    <div className="task-dag-panel">
      <h2>Task DAG</h2>
      {state.taskDAG.map(task => (
        <div key={task.id} className={`task-node ${task.status}`}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div className="dependencies">
              <strong>Depends on:</strong>
              {task.dependencies.map(depId => (
                <span key={depId}>{getTaskById(depId)?.title}</span>
              ))}
            </div>
          )}

          {/* Steps */}
          <ol className="steps">
            {task.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>

          {/* Sources from Meaning Index */}
          {task.sources.length > 0 && (
            <div className="sources">
              <strong>References:</strong>
              {task.sources.map(sourceId => {
                const meaning = state.meaningIndex.find(m => m.id === sourceId);
                return meaning ? (
                  <span key={sourceId}>{meaning.word}</span>
                ) : null;
              })}
            </div>
          )}

          {/* Status control */}
          <select
            value={task.status}
            onChange={(e) => {
              const updatedTasks = state.taskDAG.map(t =>
                t.id === task.id
                  ? { ...t, status: e.target.value as TaskNode['status'] }
                  : t
              );
              setState({ ...state, taskDAG: updatedTasks });
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      ))}
    </div>
  );
}
```

---

### Implementing Meaning/Intent Confirmation Area

Using `useHumanInTheLoop` for intent clarification:

```typescript
// In main page component
useHumanInTheLoop(
  {
    name: "clarify_meaning",
    description: "Request clarification on word/phrase meaning from user.",
    render: ({ respond, status }) => {
      return (
        <MeaningClarificationCard
          status={status}
          respond={respond}
        />
      );
    },
  },
  []
);
```

**Clarification Component**:
```typescript
function MeaningClarificationCard({ status, respond }: {
  status: "inProgress" | "executing" | "complete";
  respond?: (response: string) => void;
}) {
  const [selectedMeaning, setSelectedMeaning] = useState<string>("");
  const [customMeaning, setCustomMeaning] = useState<string>("");

  if (status !== "executing") return null;

  return (
    <div className="meaning-clarification-area">
      <h3>Meaning Clarification Needed</h3>
      <p>The term "XYZ" could mean:</p>

      <div className="options">
        <label>
          <input
            type="radio"
            name="meaning"
            value="option1"
            onChange={(e) => setSelectedMeaning(e.target.value)}
          />
          Meaning 1: [Definition from context]
        </label>
        <label>
          <input
            type="radio"
            name="meaning"
            value="option2"
            onChange={(e) => setSelectedMeaning(e.target.value)}
          />
          Meaning 2: [Alternative definition]
        </label>
        <label>
          <input
            type="radio"
            name="meaning"
            value="custom"
            onChange={(e) => setSelectedMeaning(e.target.value)}
          />
          Custom:
          <input
            type="text"
            value={customMeaning}
            onChange={(e) => setCustomMeaning(e.target.value)}
          />
        </label>
      </div>

      <button onClick={() => {
        const response = selectedMeaning === "custom"
          ? customMeaning
          : selectedMeaning;
        respond?.(response);
      }}>
        Confirm
      </button>
    </div>
  );
}
```

**Backend Tool**:
```python
@agent.tool
async def clarify_meaning(
    ctx: RunContext[StateDeps[SystemState]],
    word: str,
    possible_meanings: list[str],
) -> str:
    """Request human clarification on word meaning (HITL)."""
    # This triggers the useHumanInTheLoop hook
    # AI waits for user response
    # Returns the user's selection
    pass  # Framework handles the actual HITL flow
```

---

## Summary: Key Patterns for Target System

### 1. Meaning Index
- **Hook**: `useCoAgent<AgentState>` with `meaningIndex: MeaningEntry[]`
- **Backend**: CRUD tools that return `StateSnapshotEvent`
- **UI**: State-sensitive panel that displays and allows editing
- **AI Access**: Full read/write through tools

### 2. Task DAG
- **Hook**: Same `useCoAgent<AgentState>` with `taskDAG: TaskNode[]`
- **Backend**: DAG management tools with dependency validation
- **UI**: Visual DAG representation with status controls
- **AI Access**: Full CRUD with validation logic

### 3. Intent Clarification
- **Hook**: `useHumanInTheLoop` for blocking user input
- **Backend**: Tool that triggers HITL flow
- **UI**: Dedicated clarification area (not in chat)
- **Flow**: AI → Requests clarification → UI shows options → User selects → AI proceeds

### 4. History Panel
- Built into `CopilotSidebar` component
- Automatically logs all interactions
- No custom implementation needed

### 5. State-Sensitive UI
- All UI components receive `state` and `setState`
- React automatically re-renders on state changes
- Works for both user actions and AI actions
- No manual sync logic needed

---

## Documentation Links

### Official CopilotKit Documentation
- **Main Documentation**: https://docs.copilotkit.ai
- **PydanticAI Integration**: https://docs.copilotkit.ai/pydantic-ai
- **Frontend Actions**: https://docs.copilotkit.ai/pydantic-ai/frontend-actions
- **Shared State**: https://docs.copilotkit.ai/pydantic-ai/shared-state
- **Generative UI**: https://docs.copilotkit.ai/pydantic-ai/generative-ui
- **Human in the Loop**: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop

### Related Documentation
- **PydanticAI**: https://ai.pydantic.dev
- **Next.js**: https://nextjs.org/docs

---

## Reference Implementation Files

All file paths are absolute based on project location:
`/mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/`

### Frontend
- **Main Page**: `src/app/page.tsx`
- **Layout**: `src/app/layout.tsx`
- **Types**: `src/lib/types.ts`
- **Components**:
  - `src/components/proverbs.tsx`
  - `src/components/weather.tsx`
  - `src/components/moon.tsx`

### Backend
- **Agent Definition**: `agent/src/agent.py`
- **Main Entry**: `agent/src/main.py`

### Configuration
- **API Route**: `src/app/api/copilotkit/route.ts`
- **Package Config**: `package.json`

---

## Version Information

- **CopilotKit Version**: 1.50.0
- **React**: 19.2.1
- **Next.js**: 16.0.7
- **PydanticAI**: (version from agent/pyproject.toml)
- **Analysis Date**: 2025-12-23
