"use client";

import { IntentConfirmation } from "@/lib/types";
import { useEffect, useState } from "react";

type IntentConfirmationCardProps = {
  confirmation: IntentConfirmation;
  onRespond: (response: string) => void;
  onClear: () => void;
};

export function IntentConfirmationCard({
  confirmation,
  onRespond,
  onClear,
}: IntentConfirmationCardProps) {
  const { status, prompt, options, context, response } = confirmation;
  const [draft, setDraft] = useState(response ?? "");

  useEffect(() => {
    setDraft(response ?? "");
  }, [response, status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Meaning / Intent Confirmation
        </h2>
        {status !== "idle" ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        ) : null}
      </div>
      {status === "idle" ? (
        <p className="mt-2 text-sm text-slate-500">
          No clarification needed yet. When the agent needs confirmation, the
          request will appear here.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <p className="font-medium">{prompt}</p>
          {context ? <p className="text-xs text-slate-500">{context}</p> : null}
          {options && options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onRespond(option)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your confirmation response..."
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => onRespond(draft)}
                className="rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
