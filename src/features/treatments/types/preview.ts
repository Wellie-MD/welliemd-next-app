export type PreviewContext =
  | { type: "custom_program"; id: string; slug: string; apiBaseUrl?: string }
  | {
      type: "program";
      id: string;
      slug: string;
      visitType?: string;
      templateId?: string | null;
    }
  | { type: "section"; id: string; slug?: string; apiBaseUrl?: string };
