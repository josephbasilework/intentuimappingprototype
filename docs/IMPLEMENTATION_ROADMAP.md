# Implementation Roadmap: Intent UI System with CopilotKit + Pydantic AI

**Document Purpose**: Step-by-step guide to implement the Intent UI Mapping Prototype using the CopilotKit + Pydantic AI stack.

**Last Updated**: 2025-12-23

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack Summary](#technology-stack-summary)
3. [Implementation Phases](#implementation-phases)
4. [Complete Code Examples](#complete-code-examples)
5. [Testing & Validation](#testing--validation)
6. [Related Documentation](#related-documentation)

---

## System Overview

### What We're Building

An AI-powered intent clarification system with:
- Custom input area (not traditional chat)
- Dedicated meaning/intent confirmation UI
- Meaning Index for term definitions
- Task DAG for task planning
- History panel (traditional chat interface)
- File upload and labeling support

### Key Architectural Decisions

1. **Frontend**: Next.js with CopilotKit React hooks
2. **Backend**: PydanticAI agent with FastAPI
3. **Communication**: AG-UI protocol (automatic via CopilotKit)
4. **State Management**: Bidirectional sync via `useCoAgent`
5. **UI Pattern**: Custom components + CopilotSidebar for history

---

## Technology Stack Summary

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend Framework | Next.js | 16.0.7 | React app framework |
| AI Integration | CopilotKit | 1.50.0 | Agent-UI communication |
| Agent Framework | Pydantic AI | Latest | Backend AI agent |
| Protocol | AG-UI | 0.0.42 | Agent-UI protocol |
| Python Runtime | Python | ≥3.12 | Backend runtime |
| Package Manager | uv | Latest | Python deps |
| Node Package Manager | pnpm/npm | Latest | Frontend deps |

### Key Packages

**Frontend**:
```json
{
  "@copilotkit/react-core": "1.50.0",
  "@copilotkit/react-ui": "1.50.0",
  "@copilotkit/runtime": "1.50.0",
  "@ag-ui/client": "^0.0.42"
}
```

**Backend**:
```toml
dependencies = [
  "uvicorn",
  "pydantic-ai-slim[ag-ui]",
  "pydantic-ai-slim[openai]",
  "python-dotenv",
  "logfire>=4.10.0",
]
```

---

## Implementation Phases

### Phase 1: Backend State Models

Define complete state structure for Intent UI system.

**File**: `agent/src/models.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum

# ============================================
# Enums
# ============================================

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"

class DependencyType(str, Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"
    SOFT = "soft"

class SourceType(str, Enum):
    DOCUMENTATION = "documentation"
    FILE = "file"
    URL = "url"
    MEANING_INDEX = "meaning_index"
    EXTERNAL = "external"

# ============================================
# Task DAG Models
# ============================================

class Step(BaseModel):
    id: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    output: Optional[str] = None

class Source(BaseModel):
    id: str
    type: SourceType
    reference: str
    description: Optional[str] = None

class Dependency(BaseModel):
    from_node: str  # Node ID that must complete first
    to_node: str    # Node ID that depends on from_node
    type: DependencyType = DependencyType.REQUIRED

class Task(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    steps: List[Step] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    metadata: Dict[str, any] = Field(default_factory=dict)

class TaskDAG(BaseModel):
    tasks: Dict[str, Task] = Field(default_factory=dict)
    dependencies: List[Dependency] = Field(default_factory=list)

    def can_execute(self, task_id: str) -> bool:
        """Check if task's dependencies are satisfied."""
        # Get all required dependencies for this task
        required_deps = [
            d.from_node for d in self.dependencies
            if d.to_node == task_id and d.type == DependencyType.REQUIRED
        ]

        # Check if all required dependencies are completed
        return all(
            self.tasks.get(dep_id, Task(id="", title="", description="")).status == TaskStatus.COMPLETED
            for dep_id in required_deps
        )

    def has_cycle(self) -> bool:
        """Check if DAG has cycles (DFS-based cycle detection)."""
        visited = set()
        rec_stack = set()

        def dfs(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)

            # Get all nodes this one depends on
            for dep in self.dependencies:
                if dep.to_node == node_id:
                    if dep.from_node not in visited:
                        if dfs(dep.from_node):
                            return True
                    elif dep.from_node in rec_stack:
                        return True

            rec_stack.remove(node_id)
            return False

        for task_id in self.tasks:
            if task_id not in visited:
                if dfs(task_id):
                    return True
        return False

# ============================================
# Meaning Index Models
# ============================================

class MeaningEntry(BaseModel):
    word_or_phrase: str
    meaning: str
    sources: List[str] = Field(default_factory=list)
    context: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    confidence: float = 1.0  # How confident we are in this meaning

# ============================================
# Clarification Models
# ============================================

class ClarificationRequest(BaseModel):
    question: str
    options: Optional[List[str]] = None
    context: str = ""
    related_terms: List[str] = Field(default_factory=list)

# ============================================
# Main State Model
# ============================================

class IntentUIState(BaseModel):
    """Complete state for the Intent UI system."""

    # Task DAG
    task_dag: TaskDAG = Field(default_factory=TaskDAG)

    # Meaning Index
    meaning_index: Dict[str, MeaningEntry] = Field(default_factory=dict)

    # Clarification State
    needs_clarification: bool = False
    current_clarification: Optional[ClarificationRequest] = None

    # Input Processing
    last_user_input: str = ""
    uploaded_files: List[str] = Field(default_factory=list)

    # System State
    processing: bool = False
    error_message: Optional[str] = None
```

---

### Phase 2: Backend Agent & Tools

**File**: `agent/src/agent.py`

```python
from textwrap import dedent
from models import *
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai.models.openai import OpenAIResponsesModel
from dotenv import load_dotenv
import uuid

load_dotenv()

# ============================================
# Agent Definition
# ============================================

agent = Agent(
    model=OpenAIResponsesModel('gpt-4o'),
    deps_type=StateDeps[IntentUIState],
    system_prompt=dedent("""
        You are an intelligent intent clarification assistant.

        Your responsibilities:
        1. Analyze user input to deduce their intent
        2. Request clarification when intent is ambiguous
        3. Maintain a Meaning Index of clarified terms
        4. Create and manage a Task DAG for complex requests
        5. Validate task dependencies before updating status

        Guidelines:
        - ALWAYS use get_tasks and get_meanings tools to check current state
        - When unsure about a term's meaning, use request_clarification
        - Add clarified meanings to the Meaning Index
        - Break complex requests into granular tasks with clear dependencies
        - Reference meanings from the index when creating tasks
        - Validate DAG structure (no cycles, valid dependencies)

        Remember: You are helping the user organize their thoughts and tasks,
        not just responding to queries.
    """).strip()
)

# ============================================
# Task DAG Tools
# ============================================

@agent.tool
def get_tasks(ctx: RunContext[StateDeps[IntentUIState]]) -> Dict[str, Task]:
    """Retrieve all tasks from the DAG."""
    return ctx.deps.state.task_dag.tasks

@agent.tool
def get_executable_tasks(ctx: RunContext[StateDeps[IntentUIState]]) -> List[Task]:
    """Get all tasks whose dependencies are satisfied and can be executed."""
    dag = ctx.deps.state.task_dag
    return [
        task for task_id, task in dag.tasks.items()
        if task.status == TaskStatus.PENDING and dag.can_execute(task_id)
    ]

@agent.tool
async def create_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    title: str,
    description: str,
    dependencies: List[str] = [],
    sources: List[Dict[str, str]] = [],
    steps: List[str] = []
) -> StateSnapshotEvent:
    """Create a new task in the DAG.

    Args:
        title: Short task title
        description: Detailed description
        dependencies: List of task IDs this task depends on
        sources: List of sources (each with 'type', 'reference', 'description')
        steps: List of step descriptions
    """
    task_id = f"task-{str(uuid.uuid4())[:8]}"

    # Create task
    task = Task(
        id=task_id,
        title=title,
        description=description,
        steps=[
            Step(id=f"step-{i}", description=step_desc)
            for i, step_desc in enumerate(steps)
        ],
        sources=[
            Source(
                id=f"source-{i}",
                type=SourceType(src.get("type", "external")),
                reference=src["reference"],
                description=src.get("description")
            )
            for i, src in enumerate(sources)
        ]
    )

    # Add to DAG
    ctx.deps.state.task_dag.tasks[task_id] = task

    # Add dependencies
    for dep_id in dependencies:
        if dep_id not in ctx.deps.state.task_dag.tasks:
            raise ValueError(f"Dependency task {dep_id} does not exist")

        ctx.deps.state.task_dag.dependencies.append(
            Dependency(from_node=dep_id, to_node=task_id)
        )

    # Validate no cycles
    if ctx.deps.state.task_dag.has_cycle():
        # Rollback
        del ctx.deps.state.task_dag.tasks[task_id]
        ctx.deps.state.task_dag.dependencies = [
            d for d in ctx.deps.state.task_dag.dependencies
            if d.to_node != task_id
        ]
        raise ValueError("Creating this task would create a cycle in the DAG")

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
async def update_task_status(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    status: TaskStatus
) -> StateSnapshotEvent:
    """Update a task's status. Validates dependencies first.

    Args:
        task_id: The task to update
        status: New status
    """
    task = ctx.deps.state.task_dag.tasks.get(task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")

    # Validate dependencies for in_progress and completed
    if status in [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]:
        if not ctx.deps.state.task_dag.can_execute(task_id):
            raise ValueError(
                f"Cannot set task to {status}: dependencies not satisfied"
            )

    task.status = status

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
async def update_step_status(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str,
    step_id: str,
    status: TaskStatus,
    output: Optional[str] = None
) -> StateSnapshotEvent:
    """Update a step's status within a task.

    Args:
        task_id: Parent task ID
        step_id: Step to update
        status: New status
        output: Optional output/result of the step
    """
    task = ctx.deps.state.task_dag.tasks.get(task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")

    step = next((s for s in task.steps if s.id == step_id), None)
    if not step:
        raise ValueError(f"Step {step_id} not found in task {task_id}")

    step.status = status
    if output:
        step.output = output

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
async def delete_task(
    ctx: RunContext[StateDeps[IntentUIState]],
    task_id: str
) -> StateSnapshotEvent:
    """Delete a task from the DAG (cascades to dependencies)."""
    if task_id not in ctx.deps.state.task_dag.tasks:
        raise ValueError(f"Task {task_id} not found")

    # Remove task
    del ctx.deps.state.task_dag.tasks[task_id]

    # Remove related dependencies
    ctx.deps.state.task_dag.dependencies = [
        d for d in ctx.deps.state.task_dag.dependencies
        if d.from_node != task_id and d.to_node != task_id
    ]

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

# ============================================
# Meaning Index Tools
# ============================================

@agent.tool
def get_meanings(ctx: RunContext[StateDeps[IntentUIState]]) -> Dict[str, MeaningEntry]:
    """Retrieve all meanings from the index."""
    return ctx.deps.state.meaning_index

@agent.tool
def get_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str
) -> Optional[MeaningEntry]:
    """Look up a specific meaning from the index."""
    key = word_or_phrase.lower().strip()
    return ctx.deps.state.meaning_index.get(key)

@agent.tool
async def add_meaning(
    ctx: RunContext[StateDeps[IntentUIState]],
    word_or_phrase: str,
    meaning: str,
    sources: List[str] = [],
    context: Optional[str] = None,
    confidence: float = 1.0
) -> StateSnapshotEvent:
    """Add or update a meaning in the index.

    Args:
        word_or_phrase: The term to define
        meaning: The definition/meaning
        sources: Citations or references
        context: Additional context about usage
        confidence: How confident we are (0.0-1.0)
    """
    key = word_or_phrase.lower().strip()

    if key in ctx.deps.state.meaning_index:
        # Update existing
        entry = ctx.deps.state.meaning_index[key]
        entry.meaning = meaning
        entry.sources = sources
        entry.context = context
        entry.confidence = confidence
        entry.updated_at = datetime.now()
    else:
        # Create new
        entry = MeaningEntry(
            word_or_phrase=word_or_phrase,
            meaning=meaning,
            sources=sources,
            context=context,
            confidence=confidence
        )
        ctx.deps.state.meaning_index[key] = entry

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

@agent.tool
def search_meanings(
    ctx: RunContext[StateDeps[IntentUIState]],
    query: str
) -> List[MeaningEntry]:
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
    key = word_or_phrase.lower().strip()
    if key in ctx.deps.state.meaning_index:
        del ctx.deps.state.meaning_index[key]

    return StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=ctx.deps.state
    )

# ============================================
# Clarification Tools
# ============================================

@agent.tool
async def request_clarification(
    ctx: RunContext[StateDeps[IntentUIState]],
    question: str,
    options: Optional[List[str]] = None,
    context: str = "",
    related_terms: List[str] = []
) -> str:
    """Request clarification from the user (triggers Human-in-Loop).

    This will pause agent execution and show a clarification dialog.

    Args:
        question: The clarification question
        options: Optional list of choices
        context: Context about why clarification is needed
        related_terms: Related terms from meaning index
    """
    ctx.deps.state.needs_clarification = True
    ctx.deps.state.current_clarification = ClarificationRequest(
        question=question,
        options=options,
        context=context,
        related_terms=related_terms
    )

    # This would trigger human-in-loop on frontend
    # Return value will be user's response
    return "Waiting for user clarification..."

# ============================================
# Input Processing Tools
# ============================================

@agent.tool
async def process_user_input(
    ctx: RunContext[StateDeps[IntentUIState]],
    user_input: str
) -> str:
    """Process user input and deduce intent.

    This is the main entry point for analyzing user requests.
    """
    ctx.deps.state.last_user_input = user_input
    ctx.deps.state.processing = True

    # Agent will use other tools to analyze and respond
    return f"Processing input: {user_input[:100]}..."
```

**File**: `agent/src/main.py`

```python
from agent import IntentUIState, StateDeps, agent

# Convert agent to AG-UI ASGI app
app = agent.to_ag_ui(deps=StateDeps(IntentUIState()))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

### Phase 3: Frontend Types

**File**: `src/lib/types.ts`

```typescript
// MUST match Python Pydantic models exactly

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
  SKIPPED = "skipped",
}

export enum DependencyType {
  REQUIRED = "required",
  OPTIONAL = "optional",
  SOFT = "soft",
}

export enum SourceType {
  DOCUMENTATION = "documentation",
  FILE = "file",
  URL = "url",
  MEANING_INDEX = "meaning_index",
  EXTERNAL = "external",
}

export type Step = {
  id: string;
  description: string;
  status: TaskStatus;
  output?: string;
}

export type Source = {
  id: string;
  type: SourceType;
  reference: string;
  description?: string;
}

export type Dependency = {
  from_node: string;
  to_node: string;
  type: DependencyType;
}

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  steps: Step[];
  sources: Source[];
  metadata: Record<string, any>;
}

export type TaskDAG = {
  tasks: Record<string, Task>;
  dependencies: Dependency[];
}

export type MeaningEntry = {
  word_or_phrase: string;
  meaning: string;
  sources: string[];
  context?: string;
  created_at: string;
  updated_at: string;
  confidence: number;
}

export type ClarificationRequest = {
  question: string;
  options?: string[];
  context: string;
  related_terms: string[];
}

export type IntentUIState = {
  task_dag: TaskDAG;
  meaning_index: Record<string, MeaningEntry>;
  needs_clarification: boolean;
  current_clarification?: ClarificationRequest;
  last_user_input: string;
  uploaded_files: string[];
  processing: boolean;
  error_message?: string;
}
```

---

### Phase 4: Frontend Components

**File**: `src/app/page.tsx`

```typescript
"use client";

import { IntentUIState } from "@/lib/types";
import {
  useCoAgent,
  useHumanInTheLoop,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { InputArea } from "@/components/input-area";
import { ClarificationArea } from "@/components/clarification-area";
import { TaskDAGPanel } from "@/components/task-dag-panel";
import { MeaningIndexPanel } from "@/components/meaning-index-panel";
import { useState } from "react";

export default function IntentUIPage() {
  const [showHistory, setShowHistory] = useState(false);

  const { state, setState } = useCoAgent<IntentUIState>({
    name: "intent_agent",
    initialState: {
      task_dag: { tasks: {}, dependencies: [] },
      meaning_index: {},
      needs_clarification: false,
      last_user_input: "",
      uploaded_files: [],
      processing: false,
    },
  });

  // Human-in-the-loop for clarification
  useHumanInTheLoop({
    name: "request_clarification",
    description: "Request clarification from user",
    render: ({ args, respond, status }) => {
      if (status !== "executing") return null;

      return (
        <div className="clarification-dialog">
          <h3>Clarification Needed</h3>
          <p className="context">{args.context}</p>
          <p className="question">{args.question}</p>

          {args.options ? (
            <div className="options">
              {args.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => respond(opt)}
                  className="option-btn"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="free-text">
              <textarea
                id="clarification-input"
                placeholder="Your answer..."
                className="clarification-textarea"
              />
              <button
                onClick={() => {
                  const input = document.getElementById(
                    "clarification-input"
                  ) as HTMLTextAreaElement;
                  respond(input.value);
                }}
                className="submit-btn"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      );
    },
  });

  return (
    <div className="intent-ui-container">
      {/* Sidebar for history */}
      <CopilotSidebar
        clickOutsideToClose={true}
        defaultOpen={false}
        labels={{
          title: "History",
          initial: "All conversation history appears here.",
        }}
      >
        {/* Main content area */}
        <div className="main-content">
          {/* 1. Input Area */}
          <InputArea state={state} setState={setState} />

          {/* 2. Clarification Area (state-sensitive) */}
          {state.needs_clarification && (
            <ClarificationArea
              request={state.current_clarification}
              onResolve={(answer) => {
                // Handle clarification response
                setState({
                  ...state,
                  needs_clarification: false,
                  current_clarification: undefined,
                });
              }}
            />
          )}

          {/* 3 & 4. Task DAG and Meaning Index */}
          <div className="panels-grid">
            <TaskDAGPanel
              dag={state.task_dag}
              onUpdateTask={(taskId, updates) => {
                const updatedTasks = { ...state.task_dag.tasks };
                updatedTasks[taskId] = {
                  ...updatedTasks[taskId],
                  ...updates,
                };
                setState({
                  ...state,
                  task_dag: {
                    ...state.task_dag,
                    tasks: updatedTasks,
                  },
                });
              }}
            />

            <MeaningIndexPanel
              index={state.meaning_index}
              onUpdateMeaning={(key, entry) => {
                setState({
                  ...state,
                  meaning_index: {
                    ...state.meaning_index,
                    [key]: entry,
                  },
                });
              }}
            />
          </div>
        </div>
      </CopilotSidebar>
    </div>
  );
}
```

---

### Phase 5: Component Implementation

Create the following components:

1. **InputArea** (`src/components/input-area.tsx`)
   - Custom input field
   - File upload button
   - Submit handler that uses agent

2. **ClarificationArea** (`src/components/clarification-area.tsx`)
   - Shows when `needs_clarification` is true
   - Displays question and options
   - Sends response back to agent

3. **TaskDAGPanel** (`src/components/task-dag-panel.tsx`)
   - Visualizes tasks and dependencies
   - Shows task status
   - Allows manual status updates

4. **MeaningIndexPanel** (`src/components/meaning-index-panel.tsx`)
   - Lists all meanings
   - Search functionality
   - Add/edit/delete meanings

---

## Testing & Validation

### Test Checklist

- [ ] Backend agent starts successfully on port 8000
- [ ] Frontend connects to backend via AG-UI
- [ ] State syncs bidirectionally (test with manual updates)
- [ ] Tools are callable from agent
- [ ] Human-in-loop triggers clarification UI
- [ ] Task DAG validates dependencies
- [ ] Task DAG detects cycles
- [ ] Meaning Index CRUD works
- [ ] File upload processing works
- [ ] History panel shows conversation

### Manual Testing Steps

1. Start both servers: `npm run dev`
2. Submit simple input
3. Verify agent processes it
4. Trigger clarification request
5. Add meaning to index
6. Create task with dependencies
7. Update task status
8. Check history panel

---

## Related Documentation

This roadmap references and builds upon:

1. **GOAL.md** - Original project requirements
2. **COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md** - Detailed integration guide
3. **COPILOTKIT_DOCUMENTATION_INDEX.md** - CopilotKit concepts and hooks
4. **TASK_DAG_PROTOCOL.md** - Task DAG specification
5. **QUICK_REFERENCE.md** - Quick code patterns

### Documentation URLs

- CopilotKit Docs: https://docs.copilotkit.ai
- Pydantic AI Docs: https://ai.pydantic.dev
- Shared State: https://docs.copilotkit.ai/pydantic-ai/shared-state
- Human-in-Loop: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop
- Generative UI: https://docs.copilotkit.ai/pydantic-ai/generative-ui

---

## Next Steps

1. **Implement Phase 1-2**: Backend state and tools
2. **Implement Phase 3-4**: Frontend types and main page
3. **Implement Phase 5**: Individual components
4. **Test Integration**: Verify bidirectional sync
5. **Add File Upload**: Extend with file processing
6. **Add MCP Support**: Integrate MCP servers
7. **Polish UI**: Styling and UX improvements
8. **Add Logging**: Track agent decisions and tool calls

---

**Status**: Ready for implementation
**Priority**: High
**Complexity**: Medium
**Estimated Time**: 2-3 days for MVP
