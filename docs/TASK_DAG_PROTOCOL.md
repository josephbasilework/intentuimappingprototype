# Task DAG Protocol Definition

## Overview

This document defines the **Task DAG (Directed Acyclic Graph)** protocol for organizing tasks into a granular, contextual plan. This protocol serves as both:
1. A runtime data structure the AI can manipulate via CRUD operations
2. A markdown specification format for human-readable task plans

---

## Core Concepts

### Node (Task)
A **Node** represents a discrete unit of work in the DAG.

```yaml
Node:
  id: string           # Unique identifier (e.g., "task-001")
  title: string        # Human-readable title
  description: string  # Detailed description of what needs to be done
  status: enum         # pending | in_progress | completed | blocked | skipped
  steps: Step[]        # Optional: Multi-step breakdown
  sources: Source[]    # Optional: References/citations
  metadata: object     # Optional: Additional context
```

### Step
A **Step** is a sub-unit within a Node for multi-step tasks.

```yaml
Step:
  id: string           # Unique within parent node (e.g., "step-1")
  description: string  # What this step accomplishes
  status: enum         # pending | in_progress | completed | skipped
  output: string       # Optional: Result/output of this step
```

### Dependency
A **Dependency** defines the directional relationship between nodes.

```yaml
Dependency:
  from: node_id        # The node that must complete first
  to: node_id          # The node that depends on 'from'
  type: enum           # required | optional | soft
```

### Source
A **Source** provides reference/citation for a task.

```yaml
Source:
  id: string           # Unique identifier
  type: enum           # documentation | file | url | meaning_index | external
  reference: string    # The actual reference (URL, file path, meaning key, etc.)
  description: string  # Optional: Why this source is relevant
```

---

## Dependency Rules

### Rule 1: Directionality
- If **B depends on A**, then:
  - A has a **dependency from** B (A is a prerequisite)
  - B has a **dependency to** A (B requires A)
  - A does NOT depend on B

### Rule 2: Execution Order
- A node with **no incoming dependencies** (no `to` pointing at it) can start immediately
- A node **cannot start** until all nodes it depends on are `completed`
- A node in `blocked` status cannot proceed until its blockers are resolved

### Rule 3: Acyclicity
- The graph MUST be acyclic
- No node can transitively depend on itself
- Validation must reject cycles

### Dependency Types
| Type | Description |
|------|-------------|
| `required` | Must complete before dependent can start |
| `optional` | Should complete first, but dependent can proceed without |
| `soft` | Informational only; no execution blocking |

---

## Status Definitions

| Status | Description |
|--------|-------------|
| `pending` | Not yet started, waiting for dependencies or turn |
| `in_progress` | Currently being worked on |
| `completed` | Successfully finished |
| `blocked` | Cannot proceed due to external issue (not dependency) |
| `skipped` | Intentionally not executed |

---

## Markdown Format Specification

When representing a Task DAG in markdown, use the following format:

### Task Node Format

```markdown
## [STATUS] Task ID: Task Title

**Description:** What this task accomplishes

**Dependencies:**
- [required] task-id-1: Brief reason
- [optional] task-id-2: Brief reason

**Sources:**
- [documentation] URL or reference
- [meaning_index] key-name
- [file] ./path/to/file

**Steps:**
1. [ ] Step description
2. [x] Completed step
3. [ ] Another step

**Notes:** Any additional context
```

### Status Indicators
- `[PENDING]` - Not started
- `[IN_PROGRESS]` - Currently active
- `[COMPLETED]` - Done
- `[BLOCKED]` - Stuck
- `[SKIPPED]` - Intentionally skipped

---

## CRUD Operations

The AI has access to these operations on the Task DAG:

### Create
- `createNode(node: Node)` - Add a new task
- `createDependency(from: id, to: id, type)` - Link tasks
- `addStep(nodeId, step: Step)` - Add step to existing node
- `addSource(nodeId, source: Source)` - Add reference to node

### Read
- `getNode(id)` - Retrieve single node
- `getAllNodes()` - List all nodes
- `getDependencies(nodeId)` - Get dependencies for a node
- `getExecutableNodes()` - Get nodes ready to execute (no blocking deps)
- `getBlockedNodes()` - Get nodes waiting on dependencies
- `validateDAG()` - Check for cycles and integrity

### Update
- `updateNodeStatus(id, status)` - Change task status
- `updateStepStatus(nodeId, stepId, status)` - Change step status
- `updateNode(id, updates)` - Modify node properties
- `updateDependency(from, to, updates)` - Modify dependency

### Delete
- `deleteNode(id)` - Remove node (cascades to dependencies)
- `deleteDependency(from, to)` - Remove dependency link
- `deleteStep(nodeId, stepId)` - Remove step from node

---

## Validation Rules

A valid Task DAG must satisfy:

1. **Unique IDs**: All node IDs must be unique
2. **Acyclic**: No circular dependencies
3. **Valid References**: All dependency references must point to existing nodes
4. **Source Integrity**: All sources must be valid/accessible
5. **Status Consistency**:
   - `in_progress` nodes should have no more than reasonable parallelism
   - `completed` nodes should have all steps completed
   - Nodes with incomplete required dependencies cannot be `in_progress`

---

## Example Task DAG (Markdown)

```markdown
# Task DAG: Implement Feature X

## [COMPLETED] task-001: Research Requirements

**Description:** Understand what Feature X needs to accomplish

**Dependencies:** None (root node)

**Sources:**
- [documentation] docs/GOAL.md
- [url] https://example.com/spec

**Steps:**
1. [x] Read specification document
2. [x] Identify key requirements
3. [x] Document findings

---

## [IN_PROGRESS] task-002: Design Architecture

**Description:** Create technical design for Feature X

**Dependencies:**
- [required] task-001: Need requirements first

**Sources:**
- [file] ./docs/architecture.md

**Steps:**
1. [x] Draft component diagram
2. [ ] Define interfaces
3. [ ] Review with team

---

## [PENDING] task-003: Implement Core Logic

**Description:** Build the main functionality

**Dependencies:**
- [required] task-002: Need design first

**Sources:**
- [meaning_index] feature-x-core-concept

**Steps:**
1. [ ] Create base classes
2. [ ] Implement main algorithm
3. [ ] Add error handling

---

## [PENDING] task-004: Write Tests

**Description:** Create test suite for Feature X

**Dependencies:**
- [required] task-003: Need implementation to test
- [optional] task-002: Tests can reference design

**Sources:**
- [documentation] docs/testing-guide.md
```

---

## Integration with Meaning Index

Tasks can reference the Meaning Index via sources:

```yaml
Source:
  type: meaning_index
  reference: "user-intent-clarification"
  description: "Definition of what 'intent clarification' means in this system"
```

This creates bidirectional linkage:
- Tasks reference meanings for context
- Meanings can be updated based on task outcomes
