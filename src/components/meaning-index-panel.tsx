"use client";

import { MeaningEntry } from "@/lib/types";
import { useMemo, useState } from "react";

type MeaningIndexPanelProps = {
  meaningIndex: Record<string, MeaningEntry>;
  highlightedKey?: string | null;
  onExport?: (format?: string) => void;
  onCopyEntry?: (wordOrPhrase: string) => void;
};

export function MeaningIndexPanel({
  meaningIndex,
  highlightedKey,
  onExport,
  onCopyEntry,
}: MeaningIndexPanelProps) {
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const allEntries = Object.entries(meaningIndex);
    if (!normalized) {
      return allEntries;
    }
    return allEntries.filter(([key, entry]) => {
      return (
        key.includes(normalized) ||
        entry.meaning.toLowerCase().includes(normalized) ||
        entry.sources.some((source) =>
          source.toLowerCase().includes(normalized),
        )
      );
    });
  }, [meaningIndex, query]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Meaning Index</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{Object.keys(meaningIndex).length} entries</span>
          {onExport ? (
            <>
              <button
                type="button"
                onClick={() => onExport("json")}
                className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => onExport("csv")}
                className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                Export CSV
              </button>
            </>
          ) : null}
        </div>
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search meanings..."
        className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <div className="mt-3 space-y-3 text-sm text-slate-700">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">No meanings match yet.</p>
        ) : (
          entries.map(([key, entry]) => (
            <div
              key={key}
              className={`rounded-xl border px-3 py-2 text-xs ${
                highlightedKey === key
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {entry.word_or_phrase}
                </span>
                <div className="flex items-center gap-2">
                  {entry.updated_at ? (
                    <span className="text-[10px] text-slate-400">
                      Updated {new Date(entry.updated_at).toLocaleString()}
                    </span>
                  ) : null}
                  {onCopyEntry ? (
                    <button
                      type="button"
                      onClick={() => onCopyEntry(entry.word_or_phrase)}
                      className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      Copy
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">{entry.meaning}</p>
              {entry.sources.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              ) : null}
              {entry.context ? (
                <p className="mt-2 text-[10px] text-slate-400">
                  Context: {entry.context}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
