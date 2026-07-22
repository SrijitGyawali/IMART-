"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
