"use client";

import { HistoryButton } from "@/components/history-button";
import { HistoryPanel } from "@/components/history-panel";
import { InputArea } from "@/components/input-area";
import { IntentConfirmationCard } from "@/components/intent-confirmation-card";
import { MeaningIndexPanel } from "@/components/meaning-index-panel";
import {
  HistoryItem,
  IntentUIState,
  MeaningEntry,
  TaskNode,
} from "@/lib/types";
import {
  useCoAgent,
  useFrontendTool,
  useHumanInTheLoop,
  useCopilotReadable,
} from "@copilotkit/react-core";
import {
  CopilotKitCSSProperties,
  CopilotSidebar,
  useChatContext,
} from "@copilotkit/react-ui";
import { useMemo, useRef, useState } from "react";

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [highlightedMeaning, setHighlightedMeaning] = useState<string | null>(
    null,
  );

  return (
    <main
      style={
        { "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties
      }
    >
      <CopilotSidebar
        disableSystemMessage={true}
        clickOutsideToClose={false}
        defaultOpen={false}
        labels={{
          title: "History",
          initial: "History log for intent mapping",
        }}
        Button={() => null}
        Input={() => null}
        Window={() => null}
      >
        <YourMainContent
          themeColor={themeColor}
          highlightedMeaning={highlightedMeaning}
          onHighlightMeaning={setHighlightedMeaning}
        />
      </CopilotSidebar>
    </main>
  );
}

function YourMainContent({
  themeColor,
  highlightedMeaning,
  onHighlightMeaning,
}: {
  themeColor: string;
  highlightedMeaning: string | null;
  onHighlightMeaning: (key: string | null) => void;
}) {
  const initialState: IntentUIState = {
    meaning_index: {},
    task_dag: {},
    intent_confirmation: {
      status: "idle",
      prompt: "",
    },
    history: [],
  };

  const { state, setState } = useCoAgent<IntentUIState>({
    name: "intent_agent",
    initialState,
  });
  const safeState: IntentUIState = {
    ...initialState,
    ...state,
    meaning_index: state?.meaning_index ?? initialState.meaning_index,
    task_dag: state?.task_dag ?? initialState.task_dag,
    intent_confirmation:
      state?.intent_confirmation ?? initialState.intent_confirmation,
    history: state?.history ?? initialState.history,
  };

  const exportMeanings = (format?: string) => {
    const exportFormat = format === "csv" ? "csv" : "json";
    const entries = Object.values(safeState.meaning_index);
    const payload =
      exportFormat === "csv"
        ? [
            ["word_or_phrase", "meaning", "sources", "context", "updated_at"],
            ...entries.map((entry) => [
              entry.word_or_phrase,
              entry.meaning,
              entry.sources.join("; "),
              entry.context ?? "",
              entry.updated_at ?? "",
            ]),
          ]
            .map((row) =>
              row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
            )
            .join("\n")
        : JSON.stringify(entries, null, 2);

    const blob = new Blob([payload], {
      type: exportFormat === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meaning-index.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyMeaning = (word_or_phrase: string) => {
    const key = word_or_phrase.toLowerCase();
    const entry = safeState.meaning_index[key];
    if (!entry) {
      return;
    }
    const summary = `${entry.word_or_phrase}: ${entry.meaning}\nSources: ${entry.sources.join(
      ", ",
    )}`;
    navigator.clipboard.writeText(summary);
  };
  const { setOpen } = useChatContext();

  useCopilotReadable({
    description: "Current intent confirmation and recent meanings.",
    value: {
      intent_confirmation: safeState.intent_confirmation,
      recent_meanings: Object.values(safeState.meaning_index).slice(-5),
    },
  });

  const respondRef = useRef<(response: string) => void>(() => undefined);

  useFrontendTool({
    name: "set_intent_confirmation",
    parameters: [
      { name: "status", type: "string", required: true },
      { name: "prompt", type: "string", required: true },
      { name: "options", type: "string[]" },
      { name: "context", type: "string" },
    ],
    handler({ status, prompt, options, context }) {
      setState({
        ...safeState,
        intent_confirmation: {
          status,
          prompt,
          options,
          context,
        },
      });
    },
  });

  useFrontendTool({
    name: "resolve_intent_confirmation",
    parameters: [{ name: "response", type: "string", required: true }],
    handler({ response }) {
      setState({
        ...safeState,
        intent_confirmation: {
          ...safeState.intent_confirmation,
          status: "confirmed",
          response,
        },
      });
    },
  });

  useFrontendTool({
    name: "upsert_meaning_entry",
    parameters: [
      { name: "word_or_phrase", type: "string", required: true },
      { name: "meaning", type: "string", required: true },
      { name: "sources", type: "string[]" },
      { name: "context", type: "string" },
    ],
    handler({ word_or_phrase, meaning, sources, context }) {
      const key = word_or_phrase.toLowerCase();
      const existing = safeState.meaning_index[key];
      const entry: MeaningEntry = {
        word_or_phrase,
        meaning,
        sources: sources ?? [],
        context,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setState({
        ...safeState,
        meaning_index: {
          ...safeState.meaning_index,
          [key]: entry,
        },
      });
      onHighlightMeaning(key);
    },
  });

  useFrontendTool({
    name: "remove_meaning_entry",
    parameters: [{ name: "word_or_phrase", type: "string", required: true }],
    handler({ word_or_phrase }) {
      const key = word_or_phrase.toLowerCase();
      const { [key]: _, ...rest } = safeState.meaning_index;
      setState({
        ...safeState,
        meaning_index: rest,
      });
      onHighlightMeaning(null);
    },
  });

  useFrontendTool({
    name: "append_history_item",
    parameters: [
      { name: "role", type: "string", required: true },
      { name: "content", type: "string", required: true },
      { name: "tool_name", type: "string" },
    ],
    handler({ role, content, tool_name }) {
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        role,
        content,
        tool_name,
        timestamp: new Date().toISOString(),
      };
      setState({
        ...safeState,
        history: [...safeState.history, item],
      });
    },
  });

  useFrontendTool({
    name: "set_theme_color",
    parameters: [{ name: "themeColor", type: "string", required: true }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  useFrontendTool({
    name: "toggle_history_panel",
    parameters: [{ name: "open", type: "boolean", required: true }],
    handler({ open }) {
      setOpen(open);
    },
  });

  useFrontendTool({
    name: "highlightMeaning",
    parameters: [{ name: "word_or_phrase", type: "string", required: true }],
    handler({ word_or_phrase }) {
      onHighlightMeaning(word_or_phrase.toLowerCase());
    },
  });

  useFrontendTool({
    name: "exportMeanings",
    parameters: [{ name: "format", type: "string" }],
    handler({ format }) {
      exportMeanings(format);
    },
  });

  useFrontendTool({
    name: "copyMeaningToClipboard",
    parameters: [{ name: "word_or_phrase", type: "string", required: true }],
    handler({ word_or_phrase }) {
      copyMeaning(word_or_phrase);
    },
  });

  useHumanInTheLoop(
    {
      name: "request_clarification",
      description: "Request clarification from the user.",
      render: ({ respond }) => {
        respondRef.current = respond;
        return null;
      },
    },
    [safeState, setState],
  );

  const summary = useMemo(() => {
    const tasks = Object.values(safeState.task_dag);
    const pendingCount = tasks.filter((task) => task.status === "pending").length;
    return `${tasks.length} tasks (${pendingCount} pending), ${Object.keys(
      safeState.meaning_index,
    ).length} meanings`;
  }, [safeState.task_dag, safeState.meaning_index]);

  const handleSubmit = (value: string, files: File[]) => {
    const attachments = files.map((file) => file.name).join(", ");
    const content = attachments
      ? `${value}\n\nAttachments: ${attachments}`
      : value;
    if (!content) {
      return;
    }
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setState({
      ...safeState,
      history: [...safeState.history, item],
    });
  };

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="min-h-screen w-full bg-slate-50 px-6 py-10 transition-colors duration-300"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">
              Intent UI Mapping Prototype
            </h1>
            <HistoryButton />
          </div>
          <p className="text-sm text-indigo-100">
            Capture intent, confirm meanings, and keep a running history of
            every action.
          </p>
          <p className="text-xs font-semibold text-indigo-200">{summary}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-6">
            <InputArea onSubmit={handleSubmit} />
            <IntentConfirmationCard
              confirmation={safeState.intent_confirmation}
              onRespond={(response) => {
                respondRef.current(response);
                setState({
                  ...safeState,
                  intent_confirmation: {
                    ...safeState.intent_confirmation,
                    status: "confirmed",
                    response,
                  },
                });
              }}
              onClear={() =>
                setState({
                  ...safeState,
                  intent_confirmation: {
                    status: "idle",
                    prompt: "",
                  },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-6">
            <MeaningIndexPanel
              meaningIndex={safeState.meaning_index}
              highlightedKey={highlightedMeaning}
              onExport={exportMeanings}
              onCopyEntry={copyMeaning}
            />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Task DAG Snapshot
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.values(safeState.task_dag).length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-500">
                No tasks captured yet. The agent can create tasks and update
                them as intents are clarified.
              </p>
            ) : (
              Object.values(safeState.task_dag).map((task: TaskNode) => (
                <div key={task.id} className="px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{task.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <HistorySidebarContent history={safeState.history} />
    </div>
  );
}

function HistorySidebarContent({ history }: { history: HistoryItem[] }) {
  const { open } = useChatContext();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed right-6 top-24 z-20 hidden h-[70vh] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl lg:block">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
        History Panel
      </div>
      <HistoryPanel history={history} />
    </div>
  );
}
