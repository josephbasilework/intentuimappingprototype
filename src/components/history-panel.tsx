"use client";

import { HistoryItem } from "@/lib/types";

type HistoryPanelProps = {
  history: HistoryItem[];
};

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2 text-sm text-slate-700">
      {history.length === 0 ? (
        <p className="text-xs text-slate-500">
          No activity yet. Submissions, agent responses, and tool calls will
          appear here.
        </p>
      ) : (
        history.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase">{item.role}</span>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{item.content}</p>
            {item.tool_name ? (
              <p className="mt-2 text-[10px] text-indigo-500">
                Tool: {item.tool_name}
              </p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
