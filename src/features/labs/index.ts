/**
 * Labs feature public API.
 *
 * Folder structure:
 *   api.ts              — clientLabsApi, types (ClientLabPanel, etc.)
 *   components/
 *     LabEditDialog.tsx — edit modal for an assigned lab panel
 *   pages/
 *     Labs.tsx          — /products/labs page
 *     LabOrderDetail.tsx— lab order detail (rendered inside OrderDetail)
 */

export { clientLabsApi } from "./api";
export type { ClientLabPanel } from "./api";
