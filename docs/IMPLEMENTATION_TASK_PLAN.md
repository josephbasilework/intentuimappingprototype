# Implementation Task Plan - Intent UI Mapping Prototype v0.1

**Project:** Intent UI Mapping Prototype
**Version:** 0.1
**Created:** 2025-12-23
**Protocol:** TASK_DAG_PROTOCOL.md

---

## Overview

This implementation plan covers all features required for v0.1 of the Intent UI Mapping Prototype as specified in GOAL.md. The plan follows the Task DAG Protocol and includes granular, actionable tasks with clear dependencies.

**Key Features:**
1. Input area with file upload
2. Meaning/Intent confirmation area (NOT in chat)
3. History panel
4. Meaning Index with CRUD operations
5. Task DAG with CRUD operations
6. State-sensitive UI

---

## Foundation Tasks

### [PENDING] task-001: Define Core TypeScript Types

**Description:** Create TypeScript type definitions that mirror the backend Pydantic models for state synchronization.

**Dependencies:** None (root task)

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (sections 2.1, 4.4, 5.1)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (sections on Node, Step, Dependency, Source definitions)

**Steps:**
1. [ ] Create `src/lib/types/meaning-index.ts` with MeaningEntry type
2. [ ] Create `src/lib/types/task-dag.ts` with TaskNode, TaskStatus, Dependency, Step, Source types
3. [ ] Create `src/lib/types/agent-state.ts` with IntentUIState type combining both systems
4. [ ] Create `src/lib/types/clarification.ts` for clarification request/response types
5. [ ] Ensure all types match TASK_DAG_PROTOCOL.md specifications exactly
6. [ ] Export all types from `src/lib/types/index.ts`

**Notes:** These types MUST match the backend Pydantic models exactly for proper state synchronization via AG-UI protocol.

---

### [PENDING] task-002: Setup Backend Agent State Models

**Description:** Define Pydantic models in the Python agent that match the TypeScript types for bidirectional state sync.

**Dependencies:**
- [required] task-001: Need TypeScript types defined first to ensure matching

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (sections 2.1, 3.1, 5.1)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (all sections)

**Steps:**
1. [ ] Create `agent/src/models/meaning_index.py` with MeaningEntry model
2. [ ] Create `agent/src/models/task_dag.py` with TaskNode, TaskStatus, Dependency, Step, Source models
3. [ ] Add TaskDAG model with dependency validation methods (can_execute, validate_acyclic)
4. [ ] Create `agent/src/models/state.py` with IntentUIState model
5. [ ] Add validation methods to prevent cyclic dependencies in DAG
6. [ ] Verify all fields match TypeScript types exactly

---

### [PENDING] task-003: Initialize PydanticAI Agent

**Description:** Create the PydanticAI agent with proper configuration, system prompt, and StateDeps setup.

**Dependencies:**
- [required] task-002: Need state models defined

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (sections 2.2, 3.1-3.3)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Behavioral Flow)

**Steps:**
1. [ ] Update `agent/src/agent.py` to use IntentUIState
2. [ ] Configure agent with StateDeps[IntentUIState]
3. [ ] Write comprehensive system prompt covering intent deduction, clarification, and task planning
4. [ ] Configure OpenAI model (gpt-4o recommended for reasoning)
5. [ ] Add error handling and logging configuration

**Notes:** System prompt should instruct agent on when to request clarification vs. when to proceed autonomously.

---

### [PENDING] task-004: Setup AG-UI Endpoint

**Description:** Configure the FastAPI server to expose the AG-UI protocol endpoint for frontend communication.

**Dependencies:**
- [required] task-003: Need agent initialized

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (sections 2.3, 3.2)

**Steps:**
1. [ ] Update `agent/src/main.py` to convert agent to AG-UI app
2. [ ] Configure CORS settings for Next.js frontend
3. [ ] Set up environment variables for API keys
4. [ ] Configure logging for debugging
5. [ ] Test endpoint is accessible on port 8000

---

### [PENDING] task-005: Configure CopilotKit Runtime

**Description:** Set up the Next.js API route to connect to the PydanticAI agent via AG-UI protocol.

**Dependencies:**
- [required] task-004: Need backend endpoint running

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (sections on Architecture, Getting Started)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 3.2)

**Steps:**
1. [ ] Update `src/app/api/copilotkit/route.ts` to use HttpAgent
2. [ ] Configure runtime with intent_agent name
3. [ ] Set up ExperimentalEmptyAdapter as service adapter
4. [ ] Add error handling and request logging
5. [ ] Test connection to backend agent

---

## Meaning Index Implementation

### [PENDING] task-010: Implement Backend Meaning Index CRUD Tools

**Description:** Create PydanticAI tools for Create, Read, Update, Delete operations on the Meaning Index.

**Dependencies:**
- [required] task-003: Need agent initialized with state models

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 5.2)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 2.4 on Meaning Index Operations)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Meaning Index)

**Steps:**
1. [ ] Create `add_meaning` tool with parameters: word_or_phrase, meaning, sources, context
2. [ ] Create `get_meaning` tool to retrieve by key
3. [ ] Create `search_meanings` tool for fuzzy/semantic search
4. [ ] Create `update_meaning` tool to modify existing entries
5. [ ] Create `delete_meaning` tool to remove entries
6. [ ] All state-modifying tools must return StateSnapshotEvent
7. [ ] Add comprehensive docstrings for LLM understanding

**Notes:** Each tool should handle normalization (lowercase keys) and timestamp updates.

---

### [PENDING] task-011: Implement Frontend Meaning Index UI Component

**Description:** Create React component to display and interact with the Meaning Index.

**Dependencies:**
- [required] task-001: Need types defined
- [required] task-010: Need backend tools for data operations

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on useCoAgent)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Meaning Index)

**Steps:**
1. [ ] Create `src/components/meaning-index/MeaningIndexPanel.tsx`
2. [ ] Display all meanings in a searchable list/table
3. [ ] Show word/phrase, definition, sources, and timestamps
4. [ ] Add search/filter functionality
5. [ ] Implement click to view full details
6. [ ] Add visual indicators for recently updated meanings
7. [ ] Use useCoAgent to access state.meaning_index

---

### [PENDING] task-012: Add Frontend Meaning Index Actions

**Description:** Create frontend actions for direct UI manipulation of the Meaning Index.

**Dependencies:**
- [required] task-011: Need UI component structure

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 1 on Frontend Actions)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on useFrontendTool)

**Steps:**
1. [ ] Create `highlightMeaning` frontend action to visually highlight an entry
2. [ ] Create `exportMeanings` frontend action to download as JSON/CSV
3. [ ] Create `copyMeaningToClipboard` frontend action
4. [ ] Register all actions with useFrontendTool
5. [ ] Add UI buttons/shortcuts to trigger these actions

---

## Task DAG Implementation

### [PENDING] task-020: Implement Backend Task DAG CRUD Tools

**Description:** Create PydanticAI tools for all Task DAG operations following the TASK_DAG_PROTOCOL.md specification.

**Dependencies:**
- [required] task-003: Need agent initialized with state models

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (all sections)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 5.1)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 2.4)

**Steps:**
1. [ ] Create `create_task` tool with parameters: description, dependencies, sources, steps
2. [ ] Create `get_task` tool to retrieve single task by ID
3. [ ] Create `get_all_tasks` tool to list all tasks
4. [ ] Create `update_task_status` tool with dependency validation
5. [ ] Create `update_task` tool for modifying task properties
6. [ ] Create `delete_task` tool with cascade option
7. [ ] Create `add_task_dependency` tool to link tasks
8. [ ] Create `remove_task_dependency` tool
9. [ ] Create `get_executable_tasks` tool (tasks with completed dependencies)
10. [ ] Create `validate_dag` tool to check for cycles
11. [ ] All state-modifying tools return StateSnapshotEvent

**Notes:** Tools must enforce acyclic constraint and validate dependencies before status changes.

---

### [PENDING] task-021: Implement Task DAG Visualization Component

**Description:** Create interactive visualization of the Task DAG using a graph layout library.

**Dependencies:**
- [required] task-001: Need types defined
- [required] task-020: Need backend tools for data

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (sections on visualization)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Task DAG)

**Steps:**
1. [ ] Research and select graph visualization library (reactflow, vis.js, or d3)
2. [ ] Create `src/components/task-dag/TaskDAGVisualization.tsx`
3. [ ] Render nodes with status-based styling (pending/in_progress/completed/blocked)
4. [ ] Render directed edges for dependencies
5. [ ] Implement node selection and highlighting
6. [ ] Add zoom and pan controls
7. [ ] Show task details on node click
8. [ ] Use useCoAgent to access state.task_dag
9. [ ] Auto-layout graph when tasks change

---

### [PENDING] task-022: Implement Task Details Panel

**Description:** Create panel to show detailed information about a selected task including steps, sources, and dependencies.

**Dependencies:**
- [required] task-021: Need visualization component

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (sections on Node, Step, Source)

**Steps:**
1. [ ] Create `src/components/task-dag/TaskDetailsPanel.tsx`
2. [ ] Display task ID, title, description, status
3. [ ] Show list of dependencies with links to those tasks
4. [ ] Display multi-step breakdown with step status checkboxes
5. [ ] Show sources with links to Meaning Index entries
6. [ ] Add metadata display section
7. [ ] Highlight executable vs blocked status
8. [ ] Add edit controls (if needed for manual updates)

---

### [PENDING] task-023: Add Frontend Task DAG Actions

**Description:** Create frontend actions for DAG manipulation and visualization control.

**Dependencies:**
- [required] task-021: Need visualization component

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 1)

**Steps:**
1. [ ] Create `selectTask` action to highlight and focus a task
2. [ ] Create `expandTaskTree` action to show all descendants
3. [ ] Create `collapseTaskTree` action
4. [ ] Create `exportDAG` action to save as JSON/image
5. [ ] Create `zoomToFit` action to center all tasks in view
6. [ ] Register all actions with useFrontendTool

---

## Input Area Implementation

### [PENDING] task-030: Create Input Area Component

**Description:** Build the main input interface with text field and file upload capabilities.

**Dependencies:**
- [required] task-001: Need types defined
- [required] task-005: Need CopilotKit runtime configured

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Input Area)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on CopilotTextarea)

**Steps:**
1. [ ] Create `src/components/input/InputArea.tsx`
2. [ ] Add text field with multiline support
3. [ ] Add file upload button (accept multiple files)
4. [ ] Display uploaded files with remove option
5. [ ] Add label/tag input for file attachments
6. [ ] Create submit button to send to agent
7. [ ] Show loading state during processing
8. [ ] Clear form after successful submission

---

### [PENDING] task-031: Implement File Upload Handler

**Description:** Create backend tool to process uploaded files and extract information.

**Dependencies:**
- [required] task-030: Need frontend upload UI
- [required] task-003: Need agent initialized

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Input Area)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 5.5)

**Steps:**
1. [ ] Create `process_uploaded_file` tool with parameters: file_path, file_type, labels
2. [ ] Support text file processing (txt, md, json)
3. [ ] Support document processing (pdf, docx) if needed
4. [ ] Extract relevant information and add to Meaning Index or Task DAG
5. [ ] Return summary of what was extracted
6. [ ] Handle errors gracefully for unsupported formats

---

### [PENDING] task-032: Implement Programmatic Input Submission

**Description:** Create mechanism to send user input to agent without using default chat UI.

**Dependencies:**
- [required] task-030: Need input component
- [required] task-005: Need runtime configured

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on Programmatic Agent Interaction)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md

**Steps:**
1. [ ] Use useCopilotAction or direct API call to send messages
2. [ ] Handle form submission to trigger agent processing
3. [ ] Pass both text and file data to agent
4. [ ] Update UI based on agent response
5. [ ] Handle errors and show user feedback

---

## Intent Confirmation Area Implementation

### [PENDING] task-040: Create Intent Confirmation Area Component

**Description:** Build the dedicated area for meaning/intent confirmation that is NOT part of the chat interface.

**Dependencies:**
- [required] task-001: Need types defined
- [required] task-005: Need runtime configured

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Meaning/Intent Confirmation Area)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on State-Sensitive Conditional UI)

**Steps:**
1. [ ] Create `src/components/confirmation/IntentConfirmationArea.tsx`
2. [ ] Implement state-sensitive rendering based on agent state
3. [ ] Show different UI based on clarification type needed
4. [ ] Support empty/idle state when no clarification needed
5. [ ] Add animation for state transitions
6. [ ] Position as prominent area in main layout (not sidebar)

---

### [PENDING] task-041: Implement Human-in-the-Loop Clarification UI

**Description:** Create custom UI components for different types of clarification requests using useHumanInTheLoop.

**Dependencies:**
- [required] task-040: Need confirmation area container

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on useHumanInTheLoop Hook)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 4.4)

**Steps:**
1. [ ] Create `src/components/confirmation/MultipleChoiceClarification.tsx` for option selection
2. [ ] Create `src/components/confirmation/FreeTextClarification.tsx` for open-ended answers
3. [ ] Create `src/components/confirmation/MeaningClarification.tsx` for term definitions
4. [ ] Implement useHumanInTheLoop hook in parent component
5. [ ] Handle respond callback to send user's choice back to agent
6. [ ] Show status indicators (inProgress/executing/complete)
7. [ ] Add cancel/skip option where appropriate

---

### [PENDING] task-042: Implement Backend Clarification Request Tool

**Description:** Create PydanticAI tool that triggers the human-in-the-loop clarification flow.

**Dependencies:**
- [required] task-041: Need frontend UI ready to handle clarification
- [required] task-003: Need agent initialized

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 5.3)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 4 on User Clarification Tools)

**Steps:**
1. [ ] Create `request_clarification` tool with parameters: question, options, context, clarification_type
2. [ ] Tool should pause agent execution
3. [ ] Return user's response to agent for processing
4. [ ] Handle timeout if user doesn't respond
5. [ ] Add comprehensive docstring explaining when agent should use this tool

---

### [PENDING] task-043: Implement Generative UI for Tool Calls

**Description:** Create custom UI rendering for tool call results using useRenderToolCall.

**Dependencies:**
- [required] task-040: Need confirmation area
- [required] task-010: Need meaning tools defined
- [required] task-020: Need task tools defined

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on useRenderToolCall Hook)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_ACTIONS_TOOLS_GUIDE.md (section 1.5 on Render Functions)

**Steps:**
1. [ ] Create useRenderToolCall for `add_meaning` to show confirmation card
2. [ ] Create useRenderToolCall for `create_task` to show new task preview
3. [ ] Create useRenderToolCall for `add_task_dependency` to show graph update
4. [ ] Render custom components in confirmation area
5. [ ] Show tool execution status (inProgress/complete)
6. [ ] Display tool results in user-friendly format

---

## History Panel Implementation

### [PENDING] task-050: Create History Panel Component

**Description:** Build the history panel that shows complete conversation log including all tool calls and results.

**Dependencies:**
- [required] task-005: Need CopilotKit runtime with message history

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on History Panel)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on CopilotChat component)

**Steps:**
1. [ ] Create `src/components/history/HistoryPanel.tsx`
2. [ ] Add "History" button to toggle panel visibility
3. [ ] Use CopilotChat component for message display
4. [ ] Configure to show all messages, tool calls, and results
5. [ ] Add scrollable interface for long histories
6. [ ] Implement collapsible/expandable panel
7. [ ] Style to differentiate from main UI areas
8. [ ] Add export chat history feature

---

### [PENDING] task-051: Configure History Panel Content

**Description:** Customize what appears in the history panel including tool execution logs.

**Dependencies:**
- [required] task-050: Need base history panel

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on History Panel requirements)

**Steps:**
1. [ ] Configure CopilotChat to show user requests
2. [ ] Show agent responses
3. [ ] Display tool call names and parameters
4. [ ] Show tool execution results
5. [ ] Format errors and failures clearly
6. [ ] Add timestamps to all entries
7. [ ] Support search/filter within history

---

## Layout and Integration

### [PENDING] task-060: Design Main Application Layout

**Description:** Create the overall layout structure that integrates all components according to GOAL.md.

**Dependencies:**
- [required] task-030: Need input area component
- [required] task-040: Need confirmation area component
- [required] task-011: Need meaning index component
- [required] task-021: Need task DAG component
- [required] task-050: Need history panel component

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (all UI component sections)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on Architecture for Intent/Meaning Clarification System)

**Steps:**
1. [ ] Design layout with distinct areas: Input, Confirmation, Meaning Index, Task DAG
2. [ ] Position History panel as overlay/drawer accessible via button
3. [ ] Ensure confirmation area is visually prominent and NOT in chat
4. [ ] Use responsive design for different screen sizes
5. [ ] Implement panel resizing/collapsing where appropriate
6. [ ] Add navigation between panels
7. [ ] Test layout with all components integrated

---

### [PENDING] task-061: Integrate useCoAgent for State Management

**Description:** Set up bidirectional state synchronization between all frontend components and the backend agent.

**Dependencies:**
- [required] task-001: Need types defined
- [required] task-002: Need backend models defined
- [required] task-005: Need runtime configured

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on useCoAgent Hook)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (sections 4.1, 5.4)

**Steps:**
1. [ ] Add useCoAgent hook in main page component
2. [ ] Configure with agent name "intent_agent"
3. [ ] Set initial state matching IntentUIState type
4. [ ] Pass state to all child components via props or context
5. [ ] Verify state updates propagate from backend to frontend
6. [ ] Test manual setState calls sync to backend
7. [ ] Add error handling for sync failures

---

### [PENDING] task-062: Implement CopilotKit Provider Configuration

**Description:** Configure the root CopilotKit provider with proper settings for the Intent UI system.

**Dependencies:**
- [required] task-005: Need runtime configured

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (sections on CopilotKit Provider, Getting Started)

**Steps:**
1. [ ] Update root layout with CopilotKit provider
2. [ ] Configure runtimeUrl to "/api/copilotkit"
3. [ ] Set agent name to "intent_agent"
4. [ ] Add publicApiKey if using CopilotKit Cloud (optional)
5. [ ] Import and include CopilotKit CSS styles
6. [ ] Configure any custom CSS variables for theming
7. [ ] Test provider wraps all components correctly

---

### [PENDING] task-063: Implement State-Sensitive UI Logic

**Description:** Add conditional rendering logic so UI responds to agent state changes.

**Dependencies:**
- [required] task-061: Need state management set up
- [required] task-040: Need confirmation area
- [required] task-041: Need clarification components

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on State-sensitive UI)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on State-Sensitive Conditional UI)

**Steps:**
1. [ ] Add state flags to IntentUIState for UI control (e.g., needsClarification, clarificationType)
2. [ ] Implement conditional rendering in confirmation area based on state
3. [ ] Show appropriate clarification UI based on clarification type
4. [ ] Hide confirmation area when agent is not waiting for input
5. [ ] Update UI immediately when state changes
6. [ ] Add loading indicators during state transitions

---

## Agent Intelligence Implementation

### [PENDING] task-070: Implement Intent Deduction Logic

**Description:** Enhance agent's system prompt and add tools for intelligent intent deduction from user input.

**Dependencies:**
- [required] task-003: Need base agent initialized
- [required] task-010: Need meaning index tools
- [required] task-020: Need task DAG tools

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Behavioral Flow)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (section 5.3)

**Steps:**
1. [ ] Enhance system prompt with intent deduction instructions
2. [ ] Create `analyze_user_input` tool to process and categorize input
3. [ ] Create `detect_ambiguity` tool to identify unclear terms/intent
4. [ ] Add logic to consult Meaning Index for known terms
5. [ ] Implement decision logic: clarify vs. proceed autonomously
6. [ ] Return structured analysis of user intent

**Notes:** Agent should prioritize using existing meanings before requesting clarification.

---

### [PENDING] task-071: Implement Task Planning from Intent

**Description:** Create agent capability to generate Task DAG from clarified user intent.

**Dependencies:**
- [required] task-070: Need intent deduction working
- [required] task-020: Need task DAG tools

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Task DAG)
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (all sections)

**Steps:**
1. [ ] Enhance system prompt with task planning instructions
2. [ ] Create `generate_task_plan` tool to create multiple linked tasks
3. [ ] Implement granular task breakdown logic
4. [ ] Add dependency inference based on task relationships
5. [ ] Link tasks to relevant Meaning Index entries as sources
6. [ ] Validate generated DAG is acyclic
7. [ ] Return summary of created plan to user

---

### [PENDING] task-072: Implement Meaning Index Auto-Update

**Description:** Enable agent to automatically add/update meanings when clarifications are resolved.

**Dependencies:**
- [required] task-042: Need clarification tool working
- [required] task-010: Need meaning index tools

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (section on Behavioral Flow step 4)

**Steps:**
1. [ ] Enhance system prompt to instruct updating index after clarification
2. [ ] Create workflow: request_clarification → receive response → add_meaning
3. [ ] Auto-populate sources with "user clarification" or file reference
4. [ ] Add timestamp and context from clarification
5. [ ] Notify user when meaning is added to index
6. [ ] Handle updates to existing meanings

---

## Testing and Validation

### [PENDING] task-080: Test Meaning Index CRUD Operations

**Description:** Comprehensive testing of all Meaning Index operations from both frontend and backend.

**Dependencies:**
- [required] task-010: Need backend tools
- [required] task-011: Need frontend UI
- [required] task-012: Need frontend actions

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (Meaning Index section)

**Steps:**
1. [ ] Test adding new meaning via agent
2. [ ] Test updating existing meaning
3. [ ] Test searching meanings
4. [ ] Test deleting meaning
5. [ ] Test state sync between frontend and backend
6. [ ] Test concurrent modifications
7. [ ] Verify UI updates immediately on state changes
8. [ ] Test error handling for invalid inputs

---

### [PENDING] task-081: Test Task DAG Operations and Validation

**Description:** Test all Task DAG CRUD operations and ensure protocol compliance.

**Dependencies:**
- [required] task-020: Need backend tools
- [required] task-021: Need visualization
- [required] task-022: Need details panel

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md (all sections)

**Steps:**
1. [ ] Test creating tasks with dependencies
2. [ ] Test updating task status with dependency validation
3. [ ] Test adding and removing dependencies
4. [ ] Test cycle detection (should reject cyclic dependencies)
5. [ ] Test getting executable tasks
6. [ ] Test deleting tasks with cascade
7. [ ] Test multi-step task completion
8. [ ] Verify DAG visualization updates correctly
9. [ ] Test state sync for complex DAG structures

---

### [PENDING] task-082: Test Intent Clarification Flow

**Description:** End-to-end testing of the intent deduction and clarification workflow.

**Dependencies:**
- [required] task-070: Need intent deduction
- [required] task-042: Need clarification tool
- [required] task-041: Need clarification UI
- [required] task-072: Need auto-update meanings

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (Behavioral Flow section)

**Steps:**
1. [ ] Test agent detects ambiguous input
2. [ ] Test clarification request appears in confirmation area (NOT chat)
3. [ ] Test multiple choice clarification UI
4. [ ] Test free-text clarification UI
5. [ ] Test agent receives user response
6. [ ] Test meaning is added to index after clarification
7. [ ] Test agent proceeds with clarified intent
8. [ ] Verify entire flow is logged in history panel

---

### [PENDING] task-083: Test File Upload and Processing

**Description:** Test file upload capability and information extraction.

**Dependencies:**
- [required] task-030: Need input area
- [required] task-031: Need file handler

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (Input Area section)

**Steps:**
1. [ ] Test uploading single text file
2. [ ] Test uploading multiple files
3. [ ] Test adding labels to files
4. [ ] Test agent processes file content
5. [ ] Test extracted information added to Meaning Index or Task DAG
6. [ ] Test unsupported file format handling
7. [ ] Test large file handling

---

### [PENDING] task-084: Test State Synchronization

**Description:** Verify bidirectional state sync works correctly across all components.

**Dependencies:**
- [required] task-061: Need useCoAgent integrated
- [required] task-002: Need backend models
- [required] task-001: Need frontend types

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md (State Management section)

**Steps:**
1. [ ] Test backend state changes propagate to frontend
2. [ ] Test frontend setState updates backend
3. [ ] Test concurrent state updates from multiple sources
4. [ ] Test state persistence across page reloads (if implemented)
5. [ ] Test error recovery if sync fails
6. [ ] Monitor for state inconsistencies
7. [ ] Verify type safety prevents mismatched updates

---

### [PENDING] task-085: Integration Testing

**Description:** Test the complete system with realistic user scenarios.

**Dependencies:**
- [required] task-060: Need layout integrated
- [required] task-080: Need meaning index tested
- [required] task-081: Need task DAG tested
- [required] task-082: Need clarification tested

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (all sections)

**Steps:**
1. [ ] Test scenario: User requests complex task → agent clarifies → creates task plan
2. [ ] Test scenario: User uploads file → agent extracts info → updates index
3. [ ] Test scenario: Agent uses existing meanings → no clarification needed
4. [ ] Test scenario: User modifies task status → dependencies block/unblock correctly
5. [ ] Test scenario: Multiple clarifications in sequence
6. [ ] Test scenario: User explores history and references past interactions
7. [ ] Verify all components work together smoothly
8. [ ] Check for performance issues with large datasets

---

## Documentation and Polish

### [PENDING] task-090: Write User Documentation

**Description:** Create user-facing documentation explaining how to use the Intent UI system.

**Dependencies:**
- [required] task-085: Need system fully integrated and tested

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md

**Steps:**
1. [ ] Create user guide for input submission
2. [ ] Document meaning/intent confirmation workflow
3. [ ] Explain Task DAG visualization and interaction
4. [ ] Document Meaning Index usage
5. [ ] Explain History panel features
6. [ ] Add screenshots and examples
7. [ ] Create troubleshooting section

---

### [PENDING] task-091: Write Developer Documentation

**Description:** Document the codebase architecture and extension points for developers.

**Dependencies:**
- [required] task-085: Need system complete

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/TASK_DAG_PROTOCOL.md
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_PYDANTIC_AI_INTEGRATION_GUIDE.md

**Steps:**
1. [ ] Document project structure
2. [ ] Explain state management architecture
3. [ ] Document how to add new tools/actions
4. [ ] Explain AG-UI protocol integration
5. [ ] Document type system and sync requirements
6. [ ] Add code examples for common tasks
7. [ ] Document deployment process

---

### [PENDING] task-092: Add UI Polish and Styling

**Description:** Improve visual design and user experience across all components.

**Dependencies:**
- [required] task-060: Need layout complete
- [optional] task-085: Better to polish after integration testing

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/COPILOTKIT_DOCUMENTATION_INDEX.md (section on Custom CSS Theming)

**Steps:**
1. [ ] Create consistent color scheme and theme
2. [ ] Add smooth transitions and animations
3. [ ] Improve typography and spacing
4. [ ] Add icons for visual clarity
5. [ ] Ensure responsive design works on different screen sizes
6. [ ] Add loading states and skeletons
7. [ ] Improve error message presentation
8. [ ] Test accessibility (keyboard navigation, screen readers)

---

### [PENDING] task-093: Performance Optimization

**Description:** Optimize performance for handling large Task DAGs and Meaning Indices.

**Dependencies:**
- [required] task-085: Need baseline to optimize from

**Steps:**
1. [ ] Profile component render performance
2. [ ] Implement virtualization for large lists/graphs
3. [ ] Add pagination for Meaning Index if needed
4. [ ] Optimize graph layout algorithm
5. [ ] Add debouncing for search/filter inputs
6. [ ] Minimize re-renders with React.memo and useMemo
7. [ ] Test with large datasets (100+ tasks, 500+ meanings)
8. [ ] Optimize bundle size

---

## MCP Server Integration (Optional Enhancement)

### [PENDING] task-100: Research MCP Server Integration

**Description:** Research how to integrate Model Context Protocol (MCP) servers with the Intent UI system.

**Dependencies:**
- [required] task-085: Need core system working first

**Sources:**
- [documentation] /mnt/c/Users/18284/Documents/COMPANY/intentUIPrototype/intentuimappingprototype/docs/GOAL.md (mentions MCP server integration support)
- [external] MCP documentation

**Steps:**
1. [ ] Research MCP protocol and capabilities
2. [ ] Identify which MCP servers would be useful for intent clarification
3. [ ] Determine integration points in current architecture
4. [ ] Document requirements for MCP integration
5. [ ] Create technical design proposal

**Notes:** This is marked as v0.1 requirement but may be deferred to v0.2 if complex.

---

### [PENDING] task-101: Implement MCP Server Connection

**Description:** Add capability to connect to MCP servers for additional context and capabilities.

**Dependencies:**
- [required] task-100: Need research complete

**Sources:**
- [external] MCP documentation and examples

**Steps:**
1. [ ] Create MCP client in backend agent
2. [ ] Add configuration for MCP server URLs
3. [ ] Implement MCP tool/resource discovery
4. [ ] Create bridge between MCP capabilities and PydanticAI tools
5. [ ] Test connection to sample MCP server
6. [ ] Add UI controls for MCP server management

**Notes:** This task is optional for v0.1 and may be pushed to later version.

---

## Summary Statistics

**Total Tasks:** 44
**Root Tasks (no dependencies):** 1 (task-001)
**Backend Tasks:** 14
**Frontend Tasks:** 20
**Testing Tasks:** 6
**Documentation Tasks:** 3
**Optional Tasks:** 2

**Estimated Effort by Category:**
- Foundation: ~5-7 days
- Meaning Index: ~3-4 days
- Task DAG: ~5-6 days
- Input Area: ~2-3 days
- Intent Confirmation: ~4-5 days
- History Panel: ~1-2 days
- Layout & Integration: ~3-4 days
- Agent Intelligence: ~3-4 days
- Testing: ~4-5 days
- Documentation & Polish: ~2-3 days
- MCP Integration (optional): ~3-5 days

**Total Estimated Effort:** 35-48 days (without MCP) or 38-53 days (with MCP)

---

## Dependency Graph Summary

```
task-001 (Types)
    ├──> task-002 (Backend Models)
    │       └──> task-003 (Agent Init)
    │               ├──> task-004 (AG-UI Endpoint)
    │               │       └──> task-005 (CopilotKit Runtime)
    │               │               └──> task-062 (Provider Config)
    │               ├──> task-010 (Meaning CRUD)
    │               │       ├──> task-011 (Meaning UI)
    │               │       │       └──> task-012 (Meaning Actions)
    │               │       └──> task-080 (Meaning Tests)
    │               ├──> task-020 (Task DAG CRUD)
    │               │       ├──> task-021 (DAG Viz)
    │               │       │       ├──> task-022 (Task Details)
    │               │       │       └──> task-023 (DAG Actions)
    │               │       └──> task-081 (DAG Tests)
    │               ├──> task-031 (File Upload Handler)
    │               ├──> task-042 (Clarification Tool)
    │               ├──> task-070 (Intent Deduction)
    │               │       └──> task-071 (Task Planning)
    │               └──> task-072 (Meaning Auto-Update)
    └──> task-030 (Input Area)
            ├──> task-032 (Input Submission)
            └──> task-031 (File Upload)
    └──> task-040 (Confirmation Area)
            ├──> task-041 (HITL UI)
            │       └──> task-082 (Clarification Tests)
            └──> task-043 (Generative UI)
    └──> task-050 (History Panel)
            └──> task-051 (History Config)
    └──> task-061 (State Management)
            └──> task-063 (State-Sensitive UI)

Integration & Testing:
task-060 (Layout) requires: 030, 040, 011, 021, 050
task-084 (State Tests) requires: 061, 002, 001
task-085 (Integration Tests) requires: 060, 080, 081, 082
task-090-093 (Polish) requires: 085

Optional:
task-100 (MCP Research) requires: 085
task-101 (MCP Implementation) requires: 100
```

---

## Notes

1. **Critical Path:** task-001 → task-002 → task-003 → task-020/task-010 → task-021/task-011 → task-060 → task-085
2. **Parallel Work:** After task-003, multiple streams can proceed in parallel (Meaning Index, Task DAG, Input, Confirmation)
3. **Testing Strategy:** Unit tests for individual tools/components (task-080, 081), integration tests at the end (task-085)
4. **Type Safety:** Critical that task-001 and task-002 produce matching types; all subsequent work depends on this
5. **State Sync:** Task-061 is critical for the whole system; must be tested thoroughly (task-084)
6. **MCP Integration:** Tasks 100-101 are optional and can be deferred to v0.2 if timeline is tight

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
**Status:** All tasks in PENDING status, ready for implementation
**Next Steps:** Begin with task-001 (Define Core TypeScript Types)
