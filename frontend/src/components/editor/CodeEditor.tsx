"use client";

import dynamic from "next/dynamic";
import type { LanguageId } from "@/lib/languages";
import { languageMeta } from "@/lib/languages";
import { useTheme } from "@/lib/theme";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="monaco-fallback muted">Loading editor…</div>
  ),
});

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: LanguageId;
  height?: string;
};

export function CodeEditor({
  value,
  onChange,
  language,
  height = "260px",
}: Props) {
  const meta = languageMeta(language);
  const { theme } = useTheme();

  return (
    <div className="monaco-wrap">
      <Monaco
        height={height}
        language={meta.monaco}
        theme={theme === "dark" ? "vs-dark" : "light"}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          fontSize: 13,
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 4,
          renderLineHighlight: "line",
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
