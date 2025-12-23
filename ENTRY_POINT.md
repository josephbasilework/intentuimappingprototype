# Documentation Entry Point

This file is the starting point for navigating project documentation.

## Where to Start

1. **Global documentation index**: [docs/INDEX.md](./docs/INDEX.md)
2. **Task DAG plan**: [docs/TASK_DAG_PLAN.md](./docs/TASK_DAG_PLAN.md)
3. **Task DAG index**: [docs/TASK_DAG_INDEX.md](./docs/TASK_DAG_INDEX.md)

## How the Docs Work

- **docs/INDEX.md** is the master map of all documentation.
- **docs/TASK_DAG_PROTOCOL.md** defines the Task DAG structure and rules.
- **docs/TASK_DAG_PLAN.md** is the canonical Task DAG plan, written to the protocol format.
- **docs/TASK_DAG_INDEX.md** is the lookup table that points to specific tasks.

## Maintenance Rules

- Update the **Task DAG plan** before implementation begins.
- Update the **Task DAG index** any time task status changes.
- Move tasks to **Deprecated** only after they are completed and confirmed to follow the Task DAG protocol.
