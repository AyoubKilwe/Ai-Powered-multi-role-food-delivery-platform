"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  // Friendly error UI to avoid white-screen; shows error message and allows reset
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="max-w-2xl rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
        <p className="mt-2 text-sm text-stone-600">
          The app encountered an error. You can try reloading or report the
          details below.
        </p>
        <div className="mt-4 rounded-lg bg-stone-100 p-3 text-sm text-stone-800">
          <pre
            style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}
          >
            {String(error?.message)}
          </pre>
          <details className="mt-2 text-xs text-stone-500">
            <summary>Show stack</summary>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              {String(error?.stack)}
            </pre>
          </details>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            className="px-4 py-2 rounded bg-brand-600 text-white"
            onClick={() => reset()}
          >
            Try again
          </button>
          <button
            className="px-4 py-2 rounded border"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
