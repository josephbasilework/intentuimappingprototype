# Agent Workflow Guide

This file documents how to maintain the Task DAG plan and related docs.

## Core Documents

- **docs/INDEX.md**: Global documentation map and how-to guidance.
- **docs/TASK_DAG_PROTOCOL.md**: The required Task DAG format and rules.
- **docs/TASK_DAG_PLAN.md**: The canonical Task DAG plan.
- **docs/TASK_DAG_INDEX.md**: The index that links directly to each task.

## How to Add or Update Tasks

1. **Follow the protocol** in `docs/TASK_DAG_PROTOCOL.md` when creating or editing tasks.
2. **Add tasks to the plan** in `docs/TASK_DAG_PLAN.md` using the required markdown format.
3. **Update the index** in `docs/TASK_DAG_INDEX.md` to point to the new task anchors.
4. **Keep dependencies accurate** and ensure the DAG remains acyclic.

## Task Completion and Deprecation Policy

Tasks are only moved to **Deprecated** after all of the following are true:

1. **Completed**: The task status in `docs/TASK_DAG_PLAN.md` is marked completed.
2. **Verified**: The work is confirmed to be properly done (tests/checks or manual verification as appropriate).
3. **Protocol Adherence**: The task entry conforms to `docs/TASK_DAG_PROTOCOL.md`.
4. **Index Updated**: The task is moved from Active/Completed to Deprecated in `docs/TASK_DAG_INDEX.md`.

## When to Update the Documentation Index

Update `docs/INDEX.md` whenever new documentation is added or the doc structure changes.
