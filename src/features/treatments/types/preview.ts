export type PreviewContext =
  | { type: "custom_program"; id: string; slug: string }
  | {
      type: "program";
      id: string;
      slug: string;
      visitType?: string;
      templateId?: string | null;
      apiBaseUrl?: string;
    };
