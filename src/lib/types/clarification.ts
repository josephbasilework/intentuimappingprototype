export type IntentConfirmationStatus =
  | "idle"
  | "needs_clarification"
  | "confirmed";

export type IntentConfirmation = {
  status: IntentConfirmationStatus;
  prompt: string;
  options?: string[];
  context?: string;
  response?: string;
};
