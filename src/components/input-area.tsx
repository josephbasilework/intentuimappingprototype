"use client";

import { useId, useState } from "react";

type InputAreaProps = {
  onSubmit: (value: string, files: File[]) => void;
};

export function InputArea({ onSubmit }: InputAreaProps) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) {
      return;
    }
    onSubmit(trimmed, files);
    setValue("");
    setFiles([]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        Describe your intent
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Share your request or drop a note about what you want to map."
        className="min-h-[110px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <div className="flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="file"
            multiple
            onChange={(event) =>
              setFiles(event.target.files ? Array.from(event.target.files) : [])
            }
            className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Submit
        </button>
      </div>
      {files.length > 0 ? (
        <div className="text-xs text-slate-500">
          Attached: {files.map((file) => file.name).join(", ")}
        </div>
      ) : null}
    </form>
  );
}
