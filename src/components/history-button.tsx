"use client";

import { useChatContext } from "@copilotkit/react-ui";

export function HistoryButton() {
  const { open, setOpen } = useChatContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
    >
      {open ? "Close History" : "History"}
    </button>
  );
}
