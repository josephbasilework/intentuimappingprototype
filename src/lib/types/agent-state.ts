import { IntentConfirmation } from "./clarification";
import { MeaningEntry } from "./meaning-index";
import { TaskNode } from "./task-dag";

export type HistoryItem = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: string;
  tool_name?: string;
};

export type IntentUIState = {
  meaning_index: Record<string, MeaningEntry>;
  task_dag: Record<string, TaskNode>;
  intent_confirmation: IntentConfirmation;
  history: HistoryItem[];
};
