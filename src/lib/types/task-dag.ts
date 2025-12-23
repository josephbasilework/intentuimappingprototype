export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "skipped";

export type StepStatus = "pending" | "in_progress" | "completed" | "skipped";

export type Step = {
  id: string;
  description: string;
  status: StepStatus;
  output?: string;
};

export type DependencyType = "required" | "optional" | "soft";

export type Dependency = {
  from: string;
  to: string;
  type: DependencyType;
};

export type SourceType =
  | "documentation"
  | "file"
  | "url"
  | "meaning_index"
  | "external";

export type Source = {
  id: string;
  type: SourceType;
  reference: string;
  description?: string;
};

export type TaskNode = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  steps?: Step[];
  sources?: Source[];
  dependencies?: Dependency[];
};
