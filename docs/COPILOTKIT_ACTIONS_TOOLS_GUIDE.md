# CopilotKit Actions & Tools - Comprehensive Guide

## Overview

This document provides a comprehensive index of CopilotKit's actions and tools system, focused on building AI-powered applications with custom tools for CRUD operations, state management, and user interaction.

**Documentation Base URL:** https://docs.copilotkit.ai

---

## 1. Frontend Actions (`useCopilotAction`)

### 1.1 Basic Concept

Frontend actions allow you to expose custom functionality to the AI that can be executed in response to user requests. These actions run in the browser and can directly modify UI state.

**Key Documentation:**
- Reference: https://docs.copilotkit.ai/reference/hooks/useCopilotAction
- Guide: https://docs.copilotkit.ai/guides/frontend-actions

### 1.2 Core API

```typescript
import { useCopilotAction } from "@copilotkit/react-core";

useCopilotAction({
  name: string,                    // Unique identifier for the action
  description: string,             // Natural language description for the AI
  parameters: z.ZodSchema,         // Zod schema defining parameters
  handler: (args) => Promise<any>, // Async function to execute
  render?: (props) => ReactNode,   // Optional: render function for results
});
```

### 1.3 Parameter Definition with Zod

CopilotKit uses Zod schemas to define typed parameters that the AI can understand and provide:

```typescript
import { z } from "zod";

const parametersSchema = z.object({
  taskId: z.string().describe("The unique identifier for the task"),
  title: z.string().describe("The new title for the task"),
  dependencies: z.array(z.string()).optional().describe("Array of task IDs this task depends on"),
  priority: z.enum(["low", "medium", "high"]).describe("Task priority level"),
});
```

**Key Points:**
- Use `.describe()` to provide context to the AI
- Support for primitive types, objects, arrays, enums, and optional fields
- Nested schemas are fully supported

### 1.4 State Modification

Actions can directly modify React state, making them perfect for UI updates:

```typescript
function MyComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useCopilotAction({
    name: "addTask",
    description: "Add a new task to the task list",
    parameters: z.object({
      title: z.string().describe("Task title"),
      description: z.string().describe("Task description"),
    }),
    handler: async ({ title, description }) => {
      const newTask = { id: generateId(), title, description };
      setTasks(prev => [...prev, newTask]);
      return `Task "${title}" created successfully`;
    },
  });
}
```

### 1.5 Render Functions

Render functions allow you to display the action result in a custom UI component:

```typescript
useCopilotAction({
  name: "searchTasks",
  description: "Search for tasks matching criteria",
  parameters: z.object({
    query: z.string(),
  }),
  handler: async ({ query }) => {
    const results = await searchTasks(query);
    return results;
  },
  render: ({ status, result }) => {
    if (status === "executing") {
      return <Spinner>Searching tasks...</Spinner>;
    }
    if (status === "complete") {
      return (
        <TaskResultsList tasks={result}>
          Found {result.length} tasks
        </TaskResultsList>
      );
    }
    return null;
  },
});
```

**Render Props:**
- `status`: "executing" | "complete" | "failed"
- `result`: The value returned from the handler
- `args`: The parameters passed to the action

---

## 2. Backend Actions & Tools (CoAgents)

### 2.1 Overview

Backend actions provide server-side functionality that the AI can invoke. They're more powerful for operations requiring database access, external APIs, or heavy computation.

**Key Documentation:**
- CoAgents Guide: https://docs.copilotkit.ai/coagents
- LangGraph Integration: https://docs.copilotkit.ai/coagents/langgraph
- Custom Tools: https://docs.copilotkit.ai/coagents/custom-tools

### 2.2 LangGraph Tools (Recommended Approach)

CopilotKit integrates seamlessly with LangGraph for defining backend tools:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const createTaskTool = tool(
  async ({ title, description, dependencies }) => {
    // Server-side logic
    const task = await db.tasks.create({
      data: { title, description, dependencies }
    });
    return {
      success: true,
      taskId: task.id,
      message: `Created task: ${title}`
    };
  },
  {
    name: "create_task",
    description: "Create a new task in the task DAG",
    schema: z.object({
      title: z.string().describe("Task title"),
      description: z.string().describe("Detailed task description"),
      dependencies: z.array(z.string()).optional()
        .describe("Array of task IDs that this task depends on"),
    }),
  }
);
```

### 2.3 CoAgent Setup

Basic CoAgent structure with custom tools:

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { createTaskTool, updateTaskTool, deleteTaskTool } from "./tools";

export async function POST(req: NextRequest) {
  const runtime = new CopilotRuntime({
    actions: [
      createTaskTool,
      updateTaskTool,
      deleteTaskTool,
      // ... more tools
    ],
  });

  const { handleRequest } = runtime;
  return handleRequest(req, new OpenAIAdapter());
}
```

### 2.4 Tool Definition Patterns

#### CRUD Operations for Task DAG

```typescript
// Create Node
const createTaskNode = tool(
  async ({ title, description, parentId, metadata }) => {
    const node = await taskDAG.createNode({
      title,
      description,
      parentId,
      metadata,
    });
    return { nodeId: node.id, success: true };
  },
  {
    name: "create_task_node",
    description: "Create a new node in the task DAG",
    schema: z.object({
      title: z.string(),
      description: z.string(),
      parentId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }
);

// Add Dependency
const addTaskDependency = tool(
  async ({ taskId, dependsOnId }) => {
    await taskDAG.addEdge(taskId, dependsOnId);
    return { success: true };
  },
  {
    name: "add_task_dependency",
    description: "Add a dependency relationship between two tasks",
    schema: z.object({
      taskId: z.string().describe("The task that depends on another"),
      dependsOnId: z.string().describe("The task that must be completed first"),
    }),
  }
);

// Update Node
const updateTaskNode = tool(
  async ({ taskId, updates }) => {
    const updated = await taskDAG.updateNode(taskId, updates);
    return { success: true, task: updated };
  },
  {
    name: "update_task_node",
    description: "Update properties of an existing task node",
    schema: z.object({
      taskId: z.string(),
      updates: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        metadata: z.record(z.any()).optional(),
      }),
    }),
  }
);

// Delete Node
const deleteTaskNode = tool(
  async ({ taskId, cascade }) => {
    await taskDAG.deleteNode(taskId, { cascade });
    return { success: true, message: "Task deleted" };
  },
  {
    name: "delete_task_node",
    description: "Delete a task node from the DAG",
    schema: z.object({
      taskId: z.string(),
      cascade: z.boolean().optional()
        .describe("If true, delete dependent tasks as well"),
    }),
  }
);

// Read/Query Tasks
const queryTasks = tool(
  async ({ filters, includeChildren }) => {
    const tasks = await taskDAG.query(filters);
    if (includeChildren) {
      // Populate with child tasks
    }
    return { tasks };
  },
  {
    name: "query_tasks",
    description: "Search and retrieve tasks matching criteria",
    schema: z.object({
      filters: z.object({
        status: z.array(z.string()).optional(),
        assignee: z.string().optional(),
        tags: z.array(z.string()).optional(),
        dateRange: z.object({
          start: z.string(),
          end: z.string(),
        }).optional(),
      }).optional(),
      includeChildren: z.boolean().optional(),
    }),
  }
);
```

#### Meaning Index Operations

```typescript
// Add Meaning
const addMeaning = tool(
  async ({ concept, definition, relationships, examples }) => {
    const meaning = await meaningIndex.add({
      concept,
      definition,
      relationships,
      examples,
    });
    return { meaningId: meaning.id, success: true };
  },
  {
    name: "add_meaning",
    description: "Add a new concept/meaning to the semantic index",
    schema: z.object({
      concept: z.string().describe("The concept or term"),
      definition: z.string().describe("Clear definition of the concept"),
      relationships: z.array(z.object({
        type: z.enum(["is_a", "part_of", "related_to", "opposite_of"]),
        target: z.string(),
      })).optional(),
      examples: z.array(z.string()).optional(),
    }),
  }
);

// Update Meaning
const updateMeaning = tool(
  async ({ meaningId, updates }) => {
    const updated = await meaningIndex.update(meaningId, updates);
    return { success: true, meaning: updated };
  },
  {
    name: "update_meaning",
    description: "Update an existing meaning in the index",
    schema: z.object({
      meaningId: z.string(),
      updates: z.object({
        definition: z.string().optional(),
        relationships: z.array(z.any()).optional(),
        examples: z.array(z.string()).optional(),
      }),
    }),
  }
);

// Query Meanings
const queryMeanings = tool(
  async ({ query, semanticSearch, limit }) => {
    const results = await meaningIndex.search({
      query,
      semanticSearch,
      limit,
    });
    return { meanings: results };
  },
  {
    name: "query_meanings",
    description: "Search the meaning index for concepts",
    schema: z.object({
      query: z.string().describe("Search query"),
      semanticSearch: z.boolean().optional()
        .describe("Use semantic similarity instead of keyword search"),
      limit: z.number().optional().default(10),
    }),
  }
);
```

---

## 3. Triggering UI State Changes from Backend

### 3.1 Using CopilotKit State Management

CopilotKit provides built-in state synchronization between backend and frontend:

```typescript
// Frontend
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";

function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Make state readable to AI
  useCopilotReadable({
    description: "Current task list",
    value: tasks,
  });

  // Action that updates state
  useCopilotAction({
    name: "refreshTasksFromBackend",
    description: "Refresh task list from server",
    parameters: z.object({}),
    handler: async () => {
      const response = await fetch("/api/tasks");
      const newTasks = await response.json();
      setTasks(newTasks);
      return "Tasks refreshed";
    },
  });
}
```

### 3.2 Backend-Triggered Frontend Actions

Backend tools can return structured data that triggers frontend updates:

```typescript
// Backend tool
const createTaskWithUIUpdate = tool(
  async ({ title, description }) => {
    const task = await db.tasks.create({ data: { title, description } });

    // Return structured response that frontend can react to
    return {
      action: "task_created",
      task: task,
      uiUpdate: {
        type: "show_notification",
        message: `Task "${title}" created`,
        variant: "success",
      },
    };
  },
  {
    name: "create_task_with_ui_update",
    description: "Create a task and trigger UI notification",
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }
);

// Frontend listener
useCopilotAction({
  name: "handleUIUpdate",
  description: "Internal action to handle UI updates from backend",
  parameters: z.object({
    type: z.string(),
    message: z.string(),
    variant: z.string(),
  }),
  handler: async ({ type, message, variant }) => {
    if (type === "show_notification") {
      toast[variant](message);
    }
  },
});
```

### 3.3 Real-time Updates with Streaming

CopilotKit supports streaming responses for real-time UI updates:

```typescript
// Backend
import { CopilotRuntime } from "@copilotkit/runtime";

const streamingTool = tool(
  async function* ({ taskId }) {
    yield { status: "starting", progress: 0 };

    const task = await processTask(taskId);
    yield { status: "processing", progress: 50, task };

    const result = await finalizeTask(taskId);
    yield { status: "complete", progress: 100, result };
  },
  {
    name: "process_task_streaming",
    description: "Process a task with progress updates",
    schema: z.object({
      taskId: z.string(),
    }),
  }
);
```

---

## 4. User Clarification Tools

### 4.1 Requesting Clarification

Tools that pause execution and request user input:

```typescript
// Frontend
const askForClarification = tool(
  async ({ question, options }) => {
    // This would integrate with your UI to show a modal/prompt
    return new Promise((resolve) => {
      showClarificationModal({
        question,
        options,
        onResponse: (answer) => resolve({ answer }),
      });
    });
  },
  {
    name: "ask_user_for_clarification",
    description: "Ask the user for clarification when task requirements are ambiguous",
    schema: z.object({
      question: z.string().describe("The clarification question"),
      options: z.array(z.string()).optional()
        .describe("Optional multiple choice options"),
      context: z.string().optional()
        .describe("Additional context about why clarification is needed"),
    }),
  }
);
```

### 4.2 Confirmation Before Destructive Actions

```typescript
const deleteWithConfirmation = tool(
  async ({ taskId, requireConfirmation }) => {
    if (requireConfirmation) {
      const confirmed = await askUserConfirmation({
        message: `Are you sure you want to delete task ${taskId}?`,
        action: "delete",
      });

      if (!confirmed) {
        return { success: false, message: "Deletion cancelled by user" };
      }
    }

    await taskDAG.deleteNode(taskId);
    return { success: true, message: "Task deleted" };
  },
  {
    name: "delete_task_with_confirmation",
    description: "Delete a task, optionally requesting user confirmation first",
    schema: z.object({
      taskId: z.string(),
      requireConfirmation: z.boolean().default(true),
    }),
  }
);
```

### 4.3 Multi-step Clarification Flow

```typescript
const complexTaskCreation = tool(
  async ({ initialInput }) => {
    // Step 1: Clarify task type
    const taskType = await askForClarification({
      question: "What type of task is this?",
      options: ["feature", "bug", "research", "documentation"],
    });

    // Step 2: Based on type, ask for specific details
    let additionalFields = {};
    if (taskType.answer === "bug") {
      const severity = await askForClarification({
        question: "What is the severity of this bug?",
        options: ["critical", "high", "medium", "low"],
      });
      additionalFields = { severity: severity.answer };
    }

    // Step 3: Create task with all gathered info
    const task = await taskDAG.createNode({
      ...initialInput,
      type: taskType.answer,
      ...additionalFields,
    });

    return { success: true, task };
  },
  {
    name: "create_task_interactive",
    description: "Create a task through an interactive clarification process",
    schema: z.object({
      initialInput: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
    }),
  }
);
```

---

## 5. Advanced Patterns

### 5.1 Composable Tools

Tools can call other tools for modular functionality:

```typescript
const createTaskTree = tool(
  async ({ rootTask, subtasks }) => {
    // Create root task
    const root = await createTaskNode({
      title: rootTask.title,
      description: rootTask.description,
    });

    // Create subtasks and link them
    for (const subtask of subtasks) {
      const child = await createTaskNode({
        title: subtask.title,
        description: subtask.description,
        parentId: root.nodeId,
      });

      await addTaskDependency({
        taskId: root.nodeId,
        dependsOnId: child.nodeId,
      });
    }

    return { success: true, rootTaskId: root.nodeId };
  },
  {
    name: "create_task_tree",
    description: "Create a hierarchical tree of related tasks",
    schema: z.object({
      rootTask: z.object({
        title: z.string(),
        description: z.string(),
      }),
      subtasks: z.array(z.object({
        title: z.string(),
        description: z.string(),
      })),
    }),
  }
);
```

### 5.2 Transaction-like Operations

Tools with rollback capabilities:

```typescript
const bulkTaskUpdate = tool(
  async ({ taskIds, updates }) => {
    const originalStates = new Map();
    const updatedTasks = [];

    try {
      // Update all tasks
      for (const taskId of taskIds) {
        const original = await taskDAG.getNode(taskId);
        originalStates.set(taskId, original);

        const updated = await taskDAG.updateNode(taskId, updates);
        updatedTasks.push(updated);
      }

      return { success: true, updatedCount: updatedTasks.length };

    } catch (error) {
      // Rollback on error
      for (const [taskId, originalState] of originalStates) {
        await taskDAG.updateNode(taskId, originalState);
      }

      return {
        success: false,
        error: error.message,
        rolledBack: true,
      };
    }
  },
  {
    name: "bulk_update_tasks",
    description: "Update multiple tasks atomically with rollback on failure",
    schema: z.object({
      taskIds: z.array(z.string()),
      updates: z.record(z.any()),
    }),
  }
);
```

### 5.3 Context-Aware Tools

Tools that use conversation history and readable state:

```typescript
// Frontend - expose context
useCopilotReadable({
  description: "Current user's active project context",
  value: {
    projectId: currentProject.id,
    recentTasks: recentlyViewedTasks,
    preferences: userPreferences,
  },
});

// Backend - use context
const createContextAwareTask = tool(
  async ({ title, description }, { context }) => {
    // Context is automatically injected by CopilotKit
    const projectId = context.currentProject?.id;
    const preferences = context.preferences;

    const task = await taskDAG.createNode({
      title,
      description,
      projectId,
      priority: preferences?.defaultPriority || "medium",
    });

    return { success: true, task };
  },
  {
    name: "create_task_with_context",
    description: "Create a task using current project context",
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }
);
```

---

## 6. Best Practices

### 6.1 Action Naming

- Use clear, verb-based names: `create_task`, `update_meaning`, `query_tasks`
- Be specific: `add_task_dependency` vs generic `add_relationship`
- Prefix by domain if needed: `dag_create_node`, `index_add_meaning`

### 6.2 Descriptions

- Write from AI's perspective: "Create a new task in the task DAG"
- Include when to use: "Use this when the user wants to add a task"
- Mention side effects: "This will trigger a UI refresh"
- Provide examples in descriptions for complex parameters

### 6.3 Error Handling

```typescript
const robustTool = tool(
  async ({ taskId }) => {
    try {
      const task = await taskDAG.getNode(taskId);
      return { success: true, task };
    } catch (error) {
      if (error.code === "NOT_FOUND") {
        return {
          success: false,
          error: "Task not found",
          suggestion: "Use query_tasks to find available tasks",
        };
      }
      throw error; // Re-throw unexpected errors
    }
  },
  {
    name: "get_task",
    description: "Retrieve a task by ID",
    schema: z.object({
      taskId: z.string(),
    }),
  }
);
```

### 6.4 Return Value Structure

Consistent return types help the AI understand results:

```typescript
// Good: Structured response
return {
  success: true,
  data: { ... },
  message: "Task created successfully",
  metadata: {
    affectedNodes: 3,
    executionTime: "42ms",
  },
};

// Less helpful: Unstructured
return "Task was created";
```

### 6.5 Tool Composition

- Keep individual tools focused and single-purpose
- Create higher-level tools that compose simpler ones
- Expose both atomic and composite tools to give AI flexibility

---

## 7. Complete Example: Task DAG System

### Frontend Component

```typescript
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { z } from "zod";

function TaskDAGManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Make current state readable to AI
  useCopilotReadable({
    description: "Current task DAG state with all nodes and edges",
    value: {
      tasks,
      selectedTask,
      totalTasks: tasks.length,
    },
  });

  // Frontend action for quick task creation
  useCopilotAction({
    name: "quickAddTask",
    description: "Quickly add a task to the current view without backend persistence",
    parameters: z.object({
      title: z.string(),
      position: z.object({ x: z.number(), y: z.number() }).optional(),
    }),
    handler: async ({ title, position }) => {
      const newTask = {
        id: `temp-${Date.now()}`,
        title,
        position: position || { x: 100, y: 100 },
        temporary: true,
      };
      setTasks(prev => [...prev, newTask]);
      return "Task added to view. Use 'save_task' to persist.";
    },
    render: ({ status, result }) => {
      if (status === "complete") {
        return <Toast variant="success">{result}</Toast>;
      }
      return null;
    },
  });

  // Frontend action for UI manipulation
  useCopilotAction({
    name: "selectTask",
    description: "Highlight and select a task in the UI",
    parameters: z.object({
      taskId: z.string(),
    }),
    handler: async ({ taskId }) => {
      setSelectedTask(taskId);
      // Scroll into view
      document.getElementById(`task-${taskId}`)?.scrollIntoView({
        behavior: "smooth",
      });
      return `Task ${taskId} selected`;
    },
  });

  return (
    <div>
      <TaskDAGVisualization
        tasks={tasks}
        selectedTask={selectedTask}
      />
    </div>
  );
}
```

### Backend API Route

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define all DAG tools
const dagTools = {
  createNode: tool(
    async ({ title, description, metadata }) => {
      const node = await db.taskNodes.create({
        data: { title, description, metadata },
      });
      return { success: true, nodeId: node.id, node };
    },
    {
      name: "dag_create_node",
      description: "Create a new node in the task DAG",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        metadata: z.record(z.any()).optional(),
      }),
    }
  ),

  addEdge: tool(
    async ({ fromId, toId, edgeType }) => {
      const edge = await db.taskEdges.create({
        data: { fromId, toId, type: edgeType },
      });
      return { success: true, edgeId: edge.id };
    },
    {
      name: "dag_add_edge",
      description: "Create a dependency edge between two tasks",
      schema: z.object({
        fromId: z.string().describe("Source task ID"),
        toId: z.string().describe("Target task ID"),
        edgeType: z.enum(["depends_on", "blocks", "related_to"]).default("depends_on"),
      }),
    }
  ),

  queryDAG: tool(
    async ({ rootId, depth, includeMetadata }) => {
      const subgraph = await traverseDAG(rootId, depth);
      return {
        success: true,
        nodes: subgraph.nodes,
        edges: subgraph.edges,
      };
    },
    {
      name: "dag_query",
      description: "Query the task DAG starting from a root node",
      schema: z.object({
        rootId: z.string(),
        depth: z.number().optional().default(3),
        includeMetadata: z.boolean().optional().default(false),
      }),
    }
  ),
};

// Define meaning index tools
const meaningTools = {
  addMeaning: tool(
    async ({ concept, definition, tags }) => {
      const meaning = await db.meanings.create({
        data: { concept, definition, tags },
      });
      return { success: true, meaningId: meaning.id };
    },
    {
      name: "meaning_add",
      description: "Add a new concept to the meaning index",
      schema: z.object({
        concept: z.string(),
        definition: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    }
  ),

  queryMeanings: tool(
    async ({ query, limit }) => {
      const results = await db.meanings.search(query, { limit });
      return { success: true, meanings: results };
    },
    {
      name: "meaning_query",
      description: "Search the meaning index",
      schema: z.object({
        query: z.string(),
        limit: z.number().optional().default(10),
      }),
    }
  ),
};

export async function POST(req: NextRequest) {
  const runtime = new CopilotRuntime({
    actions: [
      ...Object.values(dagTools),
      ...Object.values(meaningTools),
    ],
  });

  const { handleRequest } = runtime;
  return handleRequest(req, new OpenAIAdapter());
}
```

---

## 8. Key Documentation URLs

### Core References
- Main Documentation: https://docs.copilotkit.ai
- useCopilotAction: https://docs.copilotkit.ai/reference/hooks/useCopilotAction
- useCopilotReadable: https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
- CopilotRuntime: https://docs.copilotkit.ai/reference/classes/CopilotRuntime

### Guides
- Frontend Actions: https://docs.copilotkit.ai/guides/frontend-actions
- CoAgents (Backend): https://docs.copilotkit.ai/coagents
- Custom Tools: https://docs.copilotkit.ai/coagents/custom-tools
- LangGraph Integration: https://docs.copilotkit.ai/coagents/langgraph
- State Management: https://docs.copilotkit.ai/guides/state-management

### Examples
- GitHub Examples: https://github.com/CopilotKit/CopilotKit/tree/main/examples
- Task Manager Example: https://github.com/CopilotKit/CopilotKit/tree/main/examples/task-manager
- CoAgent Examples: https://github.com/CopilotKit/CopilotKit/tree/main/examples/coagents

---

## 9. Summary for Your Use Case

### Task DAG System Requirements

**Recommended Architecture:**
1. **Frontend Actions** for:
   - Quick UI updates (selecting nodes, highlighting)
   - Temporary state changes
   - Visual feedback and rendering

2. **Backend Tools** for:
   - Persistent CRUD operations on DAG
   - Complex graph traversal and analysis
   - Database transactions

**Key Tools Needed:**
- `dag_create_node`, `dag_update_node`, `dag_delete_node`
- `dag_add_edge`, `dag_remove_edge`
- `dag_query` (with traversal support)
- `dag_analyze` (cycle detection, path finding)

### Meaning Index Requirements

**Recommended Tools:**
- `meaning_add`, `meaning_update`, `meaning_delete`
- `meaning_query` (semantic search)
- `meaning_relate` (add relationships)
- `meaning_get_related` (explore connections)

### UI State Management

**Patterns to Use:**
- `useCopilotReadable` to expose current UI state
- Frontend actions for immediate UI changes
- Backend tools return structured data with UI hints
- Render functions for custom result display

### User Clarification

**Patterns to Use:**
- Dedicated `ask_for_clarification` action
- Optional confirmation parameters in destructive actions
- Multi-step interactive flows for complex operations
- Context-aware suggestions based on current state

---

## 10. Migration Path

If you're building this system from scratch:

1. **Start with Frontend Actions** - Get basic UI interactions working
2. **Add Backend Tools** - Implement persistent storage
3. **Connect State** - Use `useCopilotReadable` to sync state
4. **Add Clarification** - Build interactive flows
5. **Optimize** - Add render functions, streaming, etc.

This architecture gives you maximum flexibility while keeping the AI integration clean and maintainable.
