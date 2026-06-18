export type PreviewContext =
  | { type: "custom_program"; id: string; slug: string }
  | { type: "program"; id: string; slug: string }
  | { type: "section"; id: string; slug?: string };
