export type LanguageId =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "go";

export type LanguageMeta = {
  id: LanguageId;
  label: string;
  status: "supported" | "coming_soon";
  monaco: string;
};

export const LANGUAGES: LanguageMeta[] = [
  { id: "python", label: "Python", status: "supported", monaco: "python" },
  {
    id: "javascript",
    label: "JavaScript",
    status: "coming_soon",
    monaco: "javascript",
  },
  {
    id: "typescript",
    label: "TypeScript",
    status: "coming_soon",
    monaco: "typescript",
  },
  { id: "java", label: "Java", status: "coming_soon", monaco: "java" },
  { id: "cpp", label: "C++", status: "coming_soon", monaco: "cpp" },
  { id: "go", label: "Go", status: "coming_soon", monaco: "go" },
];

export function languageMeta(id: string): LanguageMeta {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}
