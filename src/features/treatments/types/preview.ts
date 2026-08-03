export type PreviewContext =
  | { type: "custom_program"; id: string; slug: string; name?: string; apiBaseUrl?: string }
  | {
      type: "program";
      id: string;
      slug: string;
      name?: string;
      visitType?: string;
      templateId?: string | null;
    }
  | { type: "section"; id: string; slug?: string; name?: string; apiBaseUrl?: string }
  | { type: "consent"; id: string; slug?: string; name?: string; apiBaseUrl?: string };
