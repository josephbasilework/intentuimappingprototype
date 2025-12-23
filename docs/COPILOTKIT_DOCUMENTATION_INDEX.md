# CopilotKit Documentation Index

## Overview

This document serves as a comprehensive index of CopilotKit concepts, architecture, and capabilities relevant for building an intent/meaning clarification UI system. It is based on CopilotKit version 1.50.0 and focuses on the features needed for custom UI areas, state management, and AI tool/action capabilities.

**Official Documentation**: https://docs.copilotkit.ai

---

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Getting Started](#getting-started)
3. [State Management](#state-management)
4. [Custom UI Components](#custom-ui-components)
5. [Tools and Actions](#tools-and-actions)
6. [Agent Integration](#agent-integration)
7. [Advanced Patterns](#advanced-patterns)
8. [Relevant Examples from Current Implementation](#relevant-examples-from-current-implementation)

---

## Core Architecture

### CopilotKit Package Structure

CopilotKit is distributed across three main packages:

1. **@copilotkit/react-core** - Core hooks and functionality
   - State management hooks
   - Agent communication
   - Tool registration
   - Custom UI rendering

2. **@copilotkit/react-ui** - Pre-built UI components
   - `CopilotSidebar` - Sidebar chat interface
   - `CopilotPopup` - Popup chat interface
   - `CopilotChat` - Standalone chat component
   - CSS styling utilities

3. **@copilotkit/runtime** - Backend runtime
   - Agent adapters
   - HTTP request handling
   - Multi-agent orchestration
   - Service adapters

**Documentation**: https://docs.copilotkit.ai/reference/packages

### Core Concepts

#### 1. CopilotKit Provider
The root component that enables all CopilotKit functionality.

```typescript
<CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">
  {children}
</CopilotKit>
```

**Key Props**:
- `runtimeUrl`: Backend endpoint for agent communication
- `agent`: Name of the default agent to use
- `publicApiKey`: (Optional) API key for CopilotKit Cloud

**Documentation**: https://docs.copilotkit.ai/reference/CopilotKit

#### 2. Agent-UI Communication
CopilotKit uses a bidirectional communication pattern:
- Frontend → Agent: User messages, tool calls, state updates
- Agent → Frontend: Responses, tool executions, state changes

**Architecture**:
```
[React App] ←→ [CopilotRuntime] ←→ [Agent (PydanticAI/LangGraph/Custom)]
```

---

## Getting Started

### Basic Setup

#### 1. Install Dependencies

```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

#### 2. Create Runtime Endpoint

Create `/app/api/copilotkit/route.ts`:

```typescript
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({ url: "http://localhost:8000/" }),
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

**Documentation**: https://docs.copilotkit.ai/quickstart

#### 3. Wrap App with Provider

```typescript
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

#### 4. Add UI Component

```typescript
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Page() {
  return (
    <CopilotSidebar>
      <YourApp />
    </CopilotSidebar>
  );
}
```

---

## State Management

### useCoAgent Hook

**Purpose**: Bidirectional state synchronization between React and AI agent.

**Documentation**: https://docs.copilotkit.ai/reference/hooks/useCoAgent

#### Basic Usage

```typescript
import { useCoAgent } from "@copilotkit/react-core";

const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: {
    proverbs: ["Example proverb"],
  },
});
```

#### Key Features

1. **Read Agent State**: Agent can read current UI state
2. **Write Agent State**: Agent can update UI state
3. **React to State Changes**: UI updates automatically when agent modifies state
4. **Type Safety**: Full TypeScript support

#### State Flow

```
User Input → Agent Processes → Agent Updates State → UI Re-renders
     ↓                                                      ↑
UI Updates State ←────────────────────────────────────────┘
```

#### State Type Definition

```typescript
// Define your state type
export type AgentState = {
  proverbs: string[];
  meaningIndex?: Record<string, MeaningEntry>;
  taskDAG?: TaskNode[];
};

// Use in component
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: { /* ... */ },
});
```

#### Manual State Updates

```typescript
// Update state from UI
setState({
  ...state,
  proverbs: [...state.proverbs, "New proverb"],
});
```

**Relevant for Intent UI**: The meaning index and task DAG can be managed as agent state, allowing the AI to read and update them directly.

---

## Custom UI Components

### useRenderToolCall Hook (Generative UI)

**Purpose**: Render custom UI components when the agent calls specific tools.

**Documentation**: https://docs.copilotkit.ai/reference/hooks/useRenderToolCall

#### Basic Pattern

```typescript
import { useRenderToolCall } from "@copilotkit/react-core";

useRenderToolCall(
  {
    name: "get_weather",
    description: "Get the weather for a given location.",
    parameters: [
      { name: "location", type: "string", required: true }
    ],
    render: ({ args, result }) => {
      return <WeatherCard location={args.location} />;
    },
  },
  [dependencies] // Re-render when these change
);
```

#### Render Function Props

```typescript
interface RenderProps {
  args: Record<string, any>;      // Tool arguments from agent
  result?: any;                    // Tool execution result
  status: "inProgress" | "complete";
}
```

#### Advanced Usage

```typescript
useRenderToolCall({
  name: "clarify_intent",
  description: "Request user clarification on ambiguous intent",
  parameters: [
    { name: "question", type: "string", required: true },
    { name: "options", type: "array", required: true },
  ],
  render: ({ args, result, status }) => {
    return (
      <IntentClarificationCard
        question={args.question}
        options={args.options}
        status={status}
      />
    );
  },
}, []);
```

**Relevant for Intent UI**: This is perfect for rendering custom clarification UI when the agent needs to resolve ambiguity.

---

### useHumanInTheLoop Hook

**Purpose**: Pause agent execution and wait for user input/approval.

**Documentation**: https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop

#### Basic Pattern

```typescript
import { useHumanInTheLoop } from "@copilotkit/react-core";

useHumanInTheLoop(
  {
    name: "go_to_moon",
    description: "Request permission to go to the moon",
    render: ({ respond, status }) => {
      return (
        <MoonCard
          status={status}
          onApprove={() => respond("Permission granted")}
          onReject={() => respond("Permission denied")}
        />
      );
    },
  },
  [dependencies]
);
```

#### Key Features

1. **Agent Pauses**: Execution stops until user responds
2. **Custom UI**: Full control over approval interface
3. **Response Data**: Send structured data back to agent

#### Render Props

```typescript
interface HumanInTheLoopRenderProps {
  status: "inProgress" | "executing" | "complete";
  respond: (response: string | object) => void;
}
```

#### Status Lifecycle

1. **inProgress**: Agent is working, UI not shown yet
2. **executing**: Waiting for user response, show UI
3. **complete**: User responded, continue agent execution

#### Example Implementation

```typescript
function ApprovalCard({ status, respond }: HumanInTheLoopRenderProps) {
  if (status !== "executing") return null;

  return (
    <div>
      <h3>Approve this action?</h3>
      <button onClick={() => respond("approved")}>
        Approve
      </button>
      <button onClick={() => respond("rejected")}>
        Reject
      </button>
    </div>
  );
}
```

**Relevant for Intent UI**: Critical for the meaning/intent confirmation workflow. The agent can pause and request clarification, showing custom UI in the dedicated confirmation area.

---

## Tools and Actions

### useFrontendTool Hook

**Purpose**: Register tools that execute client-side JavaScript.

**Documentation**: https://docs.copilotkit.ai/reference/hooks/useFrontendTool

#### Basic Pattern

```typescript
import { useFrontendTool } from "@copilotkit/react-core";

useFrontendTool({
  name: "setThemeColor",
  description: "Change the application theme color",
  parameters: [
    {
      name: "themeColor",
      description: "The color to set (hex or CSS color name)",
      required: true,
    },
  ],
  handler({ themeColor }) {
    setThemeColor(themeColor);
  },
});
```

#### Parameter Definition

```typescript
interface ToolParameter {
  name: string;
  description: string;
  type?: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  enum?: string[];  // Restrict to specific values
}
```

#### Advanced Example

```typescript
useFrontendTool({
  name: "updateMeaningIndex",
  description: "Update the meaning index with a new definition",
  parameters: [
    { name: "term", type: "string", required: true },
    { name: "definition", type: "string", required: true },
    { name: "source", type: "string", required: false },
  ],
  handler({ term, definition, source }) {
    setState({
      ...state,
      meaningIndex: {
        ...state.meaningIndex,
        [term]: { definition, source, timestamp: Date.now() },
      },
    });
  },
});
```

#### Handler Return Values

```typescript
// Synchronous
handler() {
  return { success: true };
}

// Asynchronous
async handler() {
  const result = await apiCall();
  return result;
}
```

**Relevant for Intent UI**: Use frontend tools to manipulate the meaning index, task DAG, and other UI state directly from the agent.

---

### useDefaultTool Hook

**Purpose**: Provide default implementation for tools defined by the agent.

**Documentation**: https://docs.copilotkit.ai/reference/hooks/useDefaultTool

#### Pattern

```typescript
import { useDefaultTool } from "@copilotkit/react-core";

useDefaultTool({
  name: "search_knowledge_base",
  async handler({ query }) {
    const results = await searchAPI(query);
    return results;
  },
});
```

**Use Case**: When the agent defines a tool but you want to handle execution client-side instead of server-side.

---

## Agent Integration

### Multi-Agent Architecture

CopilotKit supports multiple agents in a single application.

#### Runtime Configuration

```typescript
const runtime = new CopilotRuntime({
  agents: {
    clarification_agent: new HttpAgent({ url: "http://localhost:8000/" }),
    task_planning_agent: new HttpAgent({ url: "http://localhost:8001/" }),
    execution_agent: new HttpAgent({ url: "http://localhost:8002/" }),
  },
});
```

#### Switching Agents

```typescript
// Use different agents for different purposes
<CopilotKit runtimeUrl="/api/copilotkit" agent="clarification_agent">
  <IntentClarificationArea />
</CopilotKit>

// Or switch dynamically
const { switchAgent } = useCopilotContext();
switchAgent("task_planning_agent");
```

**Documentation**: https://docs.copilotkit.ai/guides/multi-agent

---

### Service Adapters

Service adapters connect CopilotKit to different LLM providers and agent frameworks.

#### Available Adapters

1. **OpenAI Adapter**
```typescript
import { OpenAIAdapter } from "@copilotkit/runtime";

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4",
});
```

2. **Anthropic Adapter**
```typescript
import { AnthropicAdapter } from "@copilotkit/runtime";

const serviceAdapter = new AnthropicAdapter({
  model: "claude-3-opus-20240229",
});
```

3. **LangGraph Adapter**
```typescript
import { LangGraphAdapter } from "@copilotkit/runtime";

const serviceAdapter = new LangGraphAdapter({
  graphUrl: "http://localhost:8000/graph",
});
```

4. **PydanticAI Adapter** (via HttpAgent)
```typescript
import { HttpAgent } from "@ag-ui/client";

const agent = new HttpAgent({
  url: "http://localhost:8000/",
});
```

**Documentation**: https://docs.copilotkit.ai/reference/adapters

---

## Advanced Patterns

### Custom UI Without Chat Interface

You can use CopilotKit's core functionality without the default chat UI.

```typescript
import { CopilotKit } from "@copilotkit/react-core";
// Don't import from @copilotkit/react-ui

function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">
      <CustomIntentUI />
      <CustomMeaningIndex />
      <CustomTaskDAG />
    </CopilotKit>
  );
}
```

**Pattern**: Use hooks without `CopilotSidebar` or `CopilotChat` for fully custom interfaces.

---

### Programmatic Agent Interaction

Trigger agent actions programmatically without user chat input.

```typescript
import { useCopilotAction } from "@copilotkit/react-core";

function MyComponent() {
  const { run } = useCopilotAction({
    name: "analyze_intent",
    parameters: [
      { name: "userInput", type: "string", required: true },
    ],
  });

  const handleSubmit = async (input: string) => {
    const result = await run({ userInput: input });
    // Process result
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(inputValue);
    }}>
      {/* Custom input UI */}
    </form>
  );
}
```

**Relevant for Intent UI**: Submit user input to the agent without using the chat interface.

---

### State-Sensitive Conditional UI

Render different UI based on agent state and status.

```typescript
function IntentConfirmationArea() {
  const { state } = useCoAgent<AgentState>({ name: "my_agent" });

  return (
    <div>
      {state.needsClarification && (
        <ClarificationUI question={state.clarificationQuestion} />
      )}
      {state.taskPlanReady && (
        <TaskDAGVisualization tasks={state.taskDAG} />
      )}
      {!state.needsClarification && !state.taskPlanReady && (
        <IdleState />
      )}
    </div>
  );
}
```

**Relevant for Intent UI**: The confirmation area shows different UI based on what the agent needs.

---

### Custom CSS Theming

Control CopilotKit UI appearance with CSS variables.

```typescript
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";

<div style={{
  "--copilot-kit-primary-color": "#6366f1",
  "--copilot-kit-background-color": "#ffffff",
  "--copilot-kit-text-color": "#000000",
} as CopilotKitCSSProperties}>
  <CopilotSidebar />
</div>
```

**Available CSS Variables**:
- `--copilot-kit-primary-color`
- `--copilot-kit-secondary-color`
- `--copilot-kit-background-color`
- `--copilot-kit-text-color`
- `--copilot-kit-border-radius`
- And more...

**Documentation**: https://docs.copilotkit.ai/reference/css-variables

---

### Tool Call Interception

Intercept and modify tool calls before execution.

```typescript
useRenderToolCall({
  name: "update_task_dag",
  render: ({ args, result }) => {
    // Log or modify before rendering
    console.log("Task DAG update:", args);

    return <TaskDAGVisualization tasks={args.tasks} />;
  },
});
```

---

## Relevant Examples from Current Implementation

### 1. Shared State Management
**File**: `/src/app/page.tsx`

```typescript
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: {
    proverbs: [
      "CopilotKit may be new, but its the best thing since sliced bread.",
    ],
  },
});
```

**Pattern**: Agent can read and update the `proverbs` array. UI automatically re-renders.

---

### 2. Generative UI for Custom Components
**File**: `/src/app/page.tsx`

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
  [themeColor],
);
```

**Pattern**: When agent calls `get_weather`, custom `WeatherCard` renders in chat instead of text response.

---

### 3. Human-in-the-Loop Approval
**File**: `/src/app/page.tsx`

```typescript
useHumanInTheLoop(
  {
    name: "go_to_moon",
    description: "Go to the moon on request.",
    render: ({ respond, status }) => {
      return (
        <MoonCard themeColor={themeColor} status={status} respond={respond} />
      );
    },
  },
  [themeColor],
);
```

**Pattern**: Agent pauses when it needs to "go to the moon", shows approval UI, waits for user decision.

---

### 4. Frontend Tool Execution
**File**: `/src/app/page.tsx`

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

**Pattern**: Agent can change UI theme by calling `setThemeColor` tool.

---

### 5. Custom Sidebar Configuration
**File**: `/src/app/page.tsx`

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
    // More suggestions...
  ]}
>
  <YourMainContent themeColor={themeColor} />
</CopilotSidebar>
```

**Pattern**: Customize sidebar with labels, suggestions, and behavior options.

---

## Architecture for Intent/Meaning Clarification System

### Recommended Component Structure

```
<CopilotKit runtimeUrl="/api/copilotkit" agent="clarification_agent">
  <MainLayout>
    {/* 1. Input Area */}
    <InputArea />

    {/* 2. Meaning/Intent Confirmation Area (NOT chat) */}
    <IntentConfirmationArea>
      {/* Custom UI controlled by agent state */}
      {state.needsClarification && (
        <ClarificationUI />
      )}
    </IntentConfirmationArea>

    {/* 3. History Panel (hidden by default) */}
    {showHistory && (
      <HistoryPanel>
        <CopilotChat />  {/* Use chat component here */}
      </HistoryPanel>
    )}

    {/* 4. Meaning Index */}
    <MeaningIndexPanel meaningIndex={state.meaningIndex} />

    {/* 5. Task DAG */}
    <TaskDAGPanel taskDAG={state.taskDAG} />
  </MainLayout>
</CopilotKit>
```

### Recommended Hooks Usage

```typescript
// 1. Shared state for everything
const { state, setState } = useCoAgent<IntentSystemState>({
  name: "clarification_agent",
  initialState: {
    meaningIndex: {},
    taskDAG: [],
    needsClarification: false,
    clarificationQuestion: null,
  },
});

// 2. Human-in-the-loop for intent clarification
useHumanInTheLoop({
  name: "clarify_intent",
  render: ({ respond, status }) => (
    <IntentClarificationCard respond={respond} status={status} />
  ),
});

// 3. Generative UI for meaning confirmations
useRenderToolCall({
  name: "request_meaning_confirmation",
  render: ({ args }) => (
    <MeaningConfirmationCard term={args.term} options={args.options} />
  ),
});

// 4. Frontend tools for state manipulation
useFrontendTool({
  name: "update_meaning_index",
  handler({ term, definition, source }) {
    setState({
      ...state,
      meaningIndex: {
        ...state.meaningIndex,
        [term]: { definition, source },
      },
    });
  },
});

useFrontendTool({
  name: "update_task_dag",
  handler({ tasks }) {
    setState({ ...state, taskDAG: tasks });
  },
});
```

---

## Key Documentation URLs

### Getting Started
- **Quickstart**: https://docs.copilotkit.ai/quickstart
- **Installation**: https://docs.copilotkit.ai/guides/installation

### Core Concepts
- **Architecture Overview**: https://docs.copilotkit.ai/concepts/architecture
- **Agent Communication**: https://docs.copilotkit.ai/concepts/agents
- **State Management**: https://docs.copilotkit.ai/concepts/state

### Hooks Reference
- **useCoAgent**: https://docs.copilotkit.ai/reference/hooks/useCoAgent
- **useRenderToolCall**: https://docs.copilotkit.ai/reference/hooks/useRenderToolCall
- **useHumanInTheLoop**: https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop
- **useFrontendTool**: https://docs.copilotkit.ai/reference/hooks/useFrontendTool
- **useDefaultTool**: https://docs.copilotkit.ai/reference/hooks/useDefaultTool
- **useCopilotAction**: https://docs.copilotkit.ai/reference/hooks/useCopilotAction
- **useCopilotReadable**: https://docs.copilotkit.ai/reference/hooks/useCopilotReadable

### Components Reference
- **CopilotKit Provider**: https://docs.copilotkit.ai/reference/CopilotKit
- **CopilotSidebar**: https://docs.copilotkit.ai/reference/components/CopilotSidebar
- **CopilotPopup**: https://docs.copilotkit.ai/reference/components/CopilotPopup
- **CopilotChat**: https://docs.copilotkit.ai/reference/components/CopilotChat

### PydanticAI Integration
- **PydanticAI + CopilotKit**: https://docs.copilotkit.ai/pydantic-ai
- **Frontend Actions**: https://docs.copilotkit.ai/pydantic-ai/frontend-actions
- **Shared State**: https://docs.copilotkit.ai/pydantic-ai/shared-state
- **Generative UI**: https://docs.copilotkit.ai/pydantic-ai/generative-ui
- **Human in the Loop**: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop

### Advanced Topics
- **Multi-Agent Systems**: https://docs.copilotkit.ai/guides/multi-agent
- **Custom Agents**: https://docs.copilotkit.ai/guides/custom-agents
- **CSS Customization**: https://docs.copilotkit.ai/reference/css-variables
- **Runtime Configuration**: https://docs.copilotkit.ai/reference/CopilotRuntime

### Agent Frameworks
- **LangGraph Integration**: https://docs.copilotkit.ai/guides/langgraph
- **LangChain Integration**: https://docs.copilotkit.ai/guides/langchain
- **OpenAI Assistants**: https://docs.copilotkit.ai/guides/openai-assistants

---

## Summary for Intent/Meaning Clarification System

### What CopilotKit Provides

1. **Custom UI Areas**: Use hooks without default chat UI for full control
2. **State Management**: Bidirectional state sync between React and AI agent
3. **Tool/Action Capabilities**: Frontend tools, backend tools, human-in-the-loop
4. **Generative UI**: Render custom components when agent calls tools
5. **Multi-Agent Support**: Different agents for different tasks
6. **Flexible Architecture**: Not limited to chat interface

### How to Implement Intent UI System

1. **Input Area**: Custom React form component, use `useCopilotAction` to send to agent
2. **Meaning/Intent Confirmation**: Use `useHumanInTheLoop` to pause agent and show clarification UI
3. **History Panel**: Use `CopilotChat` component in a collapsible panel
4. **Meaning Index**: Manage as agent state with `useCoAgent`
5. **Task DAG**: Manage as agent state, provide frontend tools for CRUD operations

### Key Capabilities for Your Use Case

- **State-Sensitive UI**: Agent controls what UI shows in confirmation area
- **Custom Components**: Not limited to chat bubbles
- **Programmatic Triggers**: Submit input without chat interface
- **Bidirectional State**: Agent reads and writes to meaning index and task DAG
- **Human Approval**: Pause agent execution for user clarification
- **Tool Execution**: Agent can call frontend tools to manipulate UI

---

## Next Steps

1. Review the current implementation in `/src/app/page.tsx`
2. Design state types for intent clarification system
3. Create custom UI components for clarification area
4. Implement frontend tools for meaning index and task DAG
5. Configure PydanticAI agent to use these tools
6. Test bidirectional state synchronization

**Current Implementation**: Already using CopilotKit 1.50.0 with PydanticAI integration. Good foundation to build upon.

---

*Document generated: 2025-12-23*
*Based on: CopilotKit v1.50.0*
*Project: Intent UI Mapping Prototype*
