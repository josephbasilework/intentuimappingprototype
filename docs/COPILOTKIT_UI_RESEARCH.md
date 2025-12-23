# CopilotKit UI Components Research

> **Note**: This document is based on training data as of January 2025. Please verify all information with the live documentation at https://docs.copilotkit.ai

## Overview

CopilotKit is a framework for building AI copilots in React applications. It provides both pre-built UI components and the ability to create custom AI-driven interfaces.

---

## 1. Core UI Components

### 1.1 CopilotChat
**Primary chat interface component**

**Key Features:**
- Full-featured chat UI with message history
- Supports text input and responses
- Built-in message rendering
- Customizable appearance and behavior

**Basic Usage:**
```tsx
import { CopilotChat } from "@copilotkit/react-ui";

function App() {
  return (
    <CopilotChat
      labels={{
        title: "Your Assistant",
        initial: "Hi! How can I help you?"
      }}
    />
  );
}
```

**Documentation URL**: `https://docs.copilotkit.ai/reference/components/CopilotChat`

---

### 1.2 CopilotSidebar
**Sidebar variant of the chat interface**

**Key Features:**
- Collapsible sidebar container
- Contains CopilotChat within a sidebar layout
- Responsive design
- Customizable positioning (left/right)

**Basic Usage:**
```tsx
import { CopilotSidebar } from "@copilotkit/react-ui";

function App() {
  return (
    <CopilotSidebar
      defaultOpen={true}
      clickOutsideToClose={false}
    >
      <YourMainContent />
    </CopilotSidebar>
  );
}
```

**Documentation URL**: `https://docs.copilotkit.ai/reference/components/CopilotSidebar`

---

### 1.3 CopilotPopup
**Popup/modal variant of the chat interface**

**Key Features:**
- Floating popup window
- Typically triggered by a button
- Minimizable/expandable
- Position customization

**Basic Usage:**
```tsx
import { CopilotPopup } from "@copilotkit/react-ui";

function App() {
  return (
    <CopilotPopup
      labels={{
        title: "Assistant"
      }}
    />
  );
}
```

**Documentation URL**: `https://docs.copilotkit.ai/reference/components/CopilotPopup`

---

### 1.4 CopilotTextarea
**AI-enhanced textarea component**

**Key Features:**
- Drop-in replacement for standard textarea
- AI-powered autocompletions and suggestions
- Inline AI assistance
- Context-aware suggestions based on application state

**Basic Usage:**
```tsx
import { CopilotTextarea } from "@copilotkit/react-textarea";

function MyForm() {
  const [text, setText] = useState("");

  return (
    <CopilotTextarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Start typing..."
      autosuggestionsConfig={{
        textareaPurpose: "Write a professional email",
        chatApiConfigs: {}
      }}
    />
  );
}
```

**Documentation URL**: `https://docs.copilotkit.ai/reference/components/CopilotTextarea`

---

## 2. Customization Capabilities

### 2.1 Component Customization

#### Styling and Theming
CopilotKit components support multiple customization approaches:

1. **CSS Classes**: Components expose className props
2. **Inline Styles**: Style objects can be passed
3. **Theme Configuration**: Global theme settings
4. **Custom Rendering**: Render prop patterns for complete control

**Example - Custom Styling:**
```tsx
<CopilotChat
  className="my-custom-chat"
  style={{ maxHeight: '600px' }}
  labels={{
    title: "Custom Title",
    placeholder: "Ask me anything..."
  }}
/>
```

#### Message Rendering Customization
```tsx
<CopilotChat
  makeSystemMessage={(message) => ({
    ...message,
    content: `System: ${message.content}`
  })}
/>
```

### 2.2 Icons and Labels

All text-based UI elements can be customized via the `labels` prop:

```tsx
labels={{
  title: "My Assistant",
  initial: "Welcome! How can I help?",
  placeholder: "Type your message...",
  // ... other label overrides
}}
```

### 2.3 Custom Instructions

Provide AI with custom instructions and context:

```tsx
<CopilotChat
  instructions="You are a helpful assistant specialized in project management."
/>
```

---

## 3. Custom UI Elements with AI State

### 3.1 useCopilotReadable Hook
**Make application state available to the AI**

```tsx
import { useCopilotReadable } from "@copilotkit/react-core";

function MyComponent() {
  const [projectData, setProjectData] = useState({
    name: "Project Alpha",
    status: "in-progress"
  });

  useCopilotReadable({
    description: "Current project information",
    value: projectData
  });

  return <div>{/* Your UI */}</div>;
}
```

**Key Use Case**: Allows AI to read and understand current application state

**Documentation URL**: `https://docs.copilotkit.ai/reference/hooks/useCopilotReadable`

---

### 3.2 useCopilotAction Hook
**Create custom actions the AI can trigger**

```tsx
import { useCopilotAction } from "@copilotkit/react-core";

function MyComponent() {
  useCopilotAction({
    name: "updateProjectStatus",
    description: "Updates the status of the current project",
    parameters: [
      {
        name: "status",
        type: "string",
        description: "New status value",
        required: true
      }
    ],
    handler: async ({ status }) => {
      // Update your application state
      setProjectStatus(status);
      return `Status updated to ${status}`;
    }
  });

  return <div>{/* Your UI */}</div>;
}
```

**Key Use Case**: Allows AI to trigger state changes and UI updates

**Documentation URL**: `https://docs.copilotkit.ai/reference/hooks/useCopilotAction`

---

### 3.3 useCopilotChat Hook
**Programmatic access to chat functionality**

```tsx
import { useCopilotChat } from "@copilotkit/react-core";

function CustomUI() {
  const {
    sendMessage,
    messages,
    isLoading,
    stop
  } = useCopilotChat();

  const handleCustomSubmit = () => {
    sendMessage("Custom message from UI");
  };

  return (
    <div>
      <button onClick={handleCustomSubmit}>Send Custom Message</button>
      {isLoading && <Spinner />}
    </div>
  );
}
```

**Key Use Case**: Build completely custom UI while leveraging CopilotKit's chat engine

**Documentation URL**: `https://docs.copilotkit.ai/reference/hooks/useCopilotChat`

---

### 3.4 useCoAgentStateRender Hook
**React to AI agent state changes in your UI**

```tsx
import { useCoAgentStateRender } from "@copilotkit/react-core";

function StateResponsiveComponent() {
  useCoAgentStateRender({
    name: "intentConfirmation",
    render: ({ state }) => {
      return (
        <div className="intent-panel">
          <h3>Detected Intent: {state.intent}</h3>
          <p>Confidence: {state.confidence}%</p>
          <button onClick={() => confirmIntent(state)}>Confirm</button>
        </div>
      );
    }
  });

  return <div>{/* Main UI */}</div>;
}
```

**Key Use Case**: Create UI elements that automatically update based on AI state

**Documentation URL**: `https://docs.copilotkit.ai/reference/hooks/useCoAgentStateRender`

---

## 4. Architecture for Your Target System

Based on your requirements, here's a recommended architecture:

### 4.1 Text Input Area with File Upload

**Approach 1: Custom Component with useCopilotChat**
```tsx
function CustomInputArea() {
  const { sendMessage } = useCopilotChat();
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    // Process files and text
    const messageWithContext = {
      text: text,
      files: files.map(f => ({ name: f.name, type: f.type }))
    };

    sendMessage(JSON.stringify(messageWithContext));
  };

  return (
    <div className="custom-input-area">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        type="file"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

**Approach 2: Enhanced CopilotTextarea with Custom Actions**
```tsx
function EnhancedInputArea() {
  const [files, setFiles] = useState([]);

  useCopilotReadable({
    description: "Uploaded files",
    value: files
  });

  return (
    <div>
      <CopilotTextarea
        placeholder="Describe your intent..."
        autosuggestionsConfig={{
          textareaPurpose: "Describe user intent for file processing"
        }}
      />
      <FileUploadComponent onFilesChange={setFiles} />
    </div>
  );
}
```

---

### 4.2 Separate Intent Confirmation Area

**Use useCoAgentStateRender or useCopilotAction**

```tsx
function IntentConfirmationPanel() {
  const [intentData, setIntentData] = useState(null);

  // AI can update intent data via action
  useCopilotAction({
    name: "proposeIntent",
    description: "Proposes an interpreted intent for user confirmation",
    parameters: [
      {
        name: "intent",
        type: "object",
        description: "The interpreted intent object",
        required: true
      }
    ],
    handler: async ({ intent }) => {
      setIntentData(intent);
      return "Intent proposed for confirmation";
    }
  });

  if (!intentData) return null;

  return (
    <div className="intent-confirmation-area">
      <h2>Detected Intent</h2>
      <pre>{JSON.stringify(intentData, null, 2)}</pre>
      <button onClick={() => confirmIntent(intentData)}>Confirm</button>
      <button onClick={() => setIntentData(null)}>Reject</button>
    </div>
  );
}
```

---

### 4.3 History Panel

**Approach 1: Use useCopilotChat to access message history**
```tsx
function HistoryPanel() {
  const { messages } = useCopilotChat();

  return (
    <div className="history-panel">
      <h2>History</h2>
      {messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.role}`}>
          <span className="timestamp">{msg.timestamp}</span>
          <p>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
```

**Approach 2: Custom state management with AI sync**
```tsx
function HistoryPanel() {
  const [history, setHistory] = useState([]);

  useCopilotReadable({
    description: "User interaction history",
    value: history
  });

  useCopilotAction({
    name: "addToHistory",
    description: "Adds an entry to the history panel",
    parameters: [
      {
        name: "entry",
        type: "object",
        description: "History entry data"
      }
    ],
    handler: async ({ entry }) => {
      setHistory(prev => [...prev, { ...entry, timestamp: Date.now() }]);
    }
  });

  return (
    <div className="history-panel">
      {history.map((item, idx) => (
        <HistoryItem key={idx} data={item} />
      ))}
    </div>
  );
}
```

---

### 4.4 State-Sensitive UI Controlled by AI

**Use combination of hooks for bidirectional state sync**

```tsx
function StateSensitiveUI() {
  const [uiState, setUIState] = useState({
    mode: 'input',
    showConfirmation: false,
    processingStep: null
  });

  // Let AI read current state
  useCopilotReadable({
    description: "Current UI state and mode",
    value: uiState
  });

  // Let AI control UI state
  useCopilotAction({
    name: "updateUIState",
    description: "Updates the UI state based on processing progress",
    parameters: [
      {
        name: "newState",
        type: "object",
        description: "New UI state configuration"
      }
    ],
    handler: async ({ newState }) => {
      setUIState(prev => ({ ...prev, ...newState }));
    }
  });

  return (
    <div className={`ui-container mode-${uiState.mode}`}>
      {uiState.mode === 'input' && <InputArea />}
      {uiState.showConfirmation && <ConfirmationPanel />}
      {uiState.processingStep && (
        <ProcessingIndicator step={uiState.processingStep} />
      )}
    </div>
  );
}
```

---

## 5. Complete Example Architecture

```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

function IntentMappingApp() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="app-layout">
        {/* Main content area - NOT in chat */}
        <main className="main-content">
          <InputAreaWithFileUpload />
          <IntentConfirmationPanel />
          <HistoryPanel />
        </main>

        {/* Optional: Sidebar for AI chat assistance */}
        <CopilotSidebar
          labels={{
            title: "AI Assistant",
            initial: "Upload files and describe what you need"
          }}
        >
          {/* Chat interface for guidance/help */}
        </CopilotSidebar>
      </div>
    </CopilotKit>
  );
}

// Each component uses hooks to sync with AI
function InputAreaWithFileUpload() {
  // useCopilotChat, useCopilotReadable, etc.
}

function IntentConfirmationPanel() {
  // useCopilotAction to receive intent proposals
  // useCoAgentStateRender to react to AI state
}

function HistoryPanel() {
  // useCopilotChat for messages
  // Custom state with useCopilotAction for custom history
}
```

---

## 6. Key Documentation Resources

### Essential Pages to Review:

1. **Getting Started**: `https://docs.copilotkit.ai/getting-started`
2. **Components Reference**: `https://docs.copilotkit.ai/reference/components`
3. **Hooks Reference**: `https://docs.copilotkit.ai/reference/hooks`
4. **CopilotChat**: `https://docs.copilotkit.ai/reference/components/CopilotChat`
5. **CopilotSidebar**: `https://docs.copilotkit.ai/reference/components/CopilotSidebar`
6. **CopilotPopup**: `https://docs.copilotkit.ai/reference/components/CopilotPopup`
7. **CopilotTextarea**: `https://docs.copilotkit.ai/reference/components/CopilotTextarea`
8. **useCopilotAction**: `https://docs.copilotkit.ai/reference/hooks/useCopilotAction`
9. **useCopilotReadable**: `https://docs.copilotkit.ai/reference/hooks/useCopilotReadable`
10. **useCopilotChat**: `https://docs.copilotkit.ai/reference/hooks/useCopilotChat`
11. **useCoAgentStateRender**: `https://docs.copilotkit.ai/reference/hooks/useCoAgentStateRender`
12. **Customization Guide**: `https://docs.copilotkit.ai/guides/customization`
13. **CoAgents (Advanced State Management)**: `https://docs.copilotkit.ai/coagents`

---

## 7. Recommendations for Your System

### Architecture Pattern:

1. **Don't use chat as primary interface** - Use custom components with `useCopilotChat` for programmatic control
2. **Separate concerns**:
   - Input Area: Custom component with file upload + text
   - Confirmation Area: Driven by `useCopilotAction` receiving AI proposals
   - History Panel: Custom state or message history from `useCopilotChat`
   - Optional sidebar chat: For user questions/help only

3. **State synchronization**:
   - Use `useCopilotReadable` to expose app state to AI
   - Use `useCopilotAction` to let AI trigger UI updates
   - Use `useCoAgentStateRender` for complex AI state rendering

4. **File handling**:
   - Custom file upload component
   - Expose file metadata via `useCopilotReadable`
   - Process files server-side, share context with AI

### Investigation Checklist:

When you review the live documentation, specifically look for:

- [ ] Latest API changes for hooks (as of late 2024/early 2025)
- [ ] File upload handling patterns
- [ ] CoAgents documentation (for advanced state management)
- [ ] Server-side integration patterns
- [ ] Authentication and security considerations
- [ ] Examples of non-chat UI patterns
- [ ] Custom rendering and styling examples
- [ ] Error handling and loading states
- [ ] TypeScript type definitions

---

## 8. Questions to Investigate

1. **File Upload**: Does CopilotKit have built-in file upload support, or is it fully custom?
2. **State Rendering**: Is `useCoAgentStateRender` the best hook for non-chat UI updates?
3. **Message Types**: Can messages include structured data beyond text?
4. **Backend Integration**: What's required on the backend to support custom actions?
5. **Real-time Updates**: How does the UI react to streaming responses from AI?
6. **Multi-step Workflows**: How to orchestrate multi-step processes with confirmation gates?

---

## Conclusion

CopilotKit appears to support your use case through:

1. **Headless capabilities**: You can build custom UI without using their chat components
2. **Bidirectional state sync**: AI can read and write application state
3. **Custom actions**: AI can trigger specific UI updates and state changes
4. **Flexible architecture**: Mix pre-built components with custom elements

The key is using the hooks (useCopilotChat, useCopilotAction, useCopilotReadable) to build your own UI rather than relying solely on the pre-built chat components.

**Next Steps**: Visit the live documentation to verify these patterns and discover any new features or best practices added recently.
