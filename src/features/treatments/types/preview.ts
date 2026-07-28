interface TenantPreviewIdentity {
  clientId?: string;
  clientName?: string;
}

export type PreviewContext =
  | ({ type: "custom_program"; id: string; slug: string; apiBaseUrl?: string } & TenantPreviewIdentity)
  | {
      type: "program";
      id: string;
      slug: string;
      visitType?: string;
      templateId?: string | null;
      apiBaseUrl?: string;
    } & TenantPreviewIdentity
  | { type: "section"; id: string; slug?: string; apiBaseUrl?: string };
