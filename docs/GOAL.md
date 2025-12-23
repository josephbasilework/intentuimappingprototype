# Intent UI Mapping Prototype - Project Goal

## Version 0.1 - User Intent/Meaning Clarification System

### Core Concept
A system for user intent/meaning clarification with a **Meaning Index** that maps selected words/phrases to meanings/sources.

---

## UI Components

### 1. Input Area
- **Text field** with an upload button
- **File attachments** to chat (supported formats) with label capabilities
- **MCP server integration** support

### 2. Meaning/Intent Confirmation Area
- **NOT a traditional chatbot continuation** in the text field
- Dedicated area for meaning/intent confirmation
- **State-sensitive UI** controlled by the system
- The AI deduces meaning/intent and may request clarification here

### 3. History Panel
- Accessible via a **"History" button**
- Traditional scrollable chatbot interface
- Contains **all conversation data**:
  - Requests and replies
  - Tool call results/attempts
  - Complete interaction log

### 4. Meaning Index
- Catalog of meanings and associated context
- Maps words/phrases to:
  - Definitions/meanings
  - Sources (citations/references)

---

## Task DAG (Directed Acyclic Graph)

### Overview
A tool the AI has CRUD access to for organizing tasks into a granular, contextual plan.

### Structure
- **Nodes** represent tasks
- **Dependencies** are directional:
  - If B depends on A: A has a dependency from B
  - A does not depend on B (A can proceed independently)
  - B cannot proceed until A is finished/attempted

### Features
- **Sources/References**: Tasks can cite sources (like the Meaning Index)
- **Multi-step Tasks**: A single task can consist of multiple steps

---

## Behavioral Flow

1. User submits input (text, files, labels)
2. Intelligent system attempts to deduce meaning/intent
3. If clarification needed:
   - Confirmation request appears in Meaning/Intent Confirmation Area
   - NOT in the chat textfield
4. Meaning Index updated with resolved meanings
5. Task DAG can be created/modified for planning
6. All interactions logged in History

---

## Technical Stack
- **Frontend**: Next.js (from CopilotKit template)
- **Agent Framework**: Pydantic AI
- **Integration**: CopilotKit for AI copilot capabilities
