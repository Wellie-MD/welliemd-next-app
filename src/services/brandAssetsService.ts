import api from "../api/axiosInstance";

/**
 * Brand images (logos, favicon, login image) use the same authenticated S3 upload
 * as chat attachments (StorageUploadView / PublicRootS3Storage), exposed at a
 * dedicated route for the Brand settings page.
 */
export async function uploadBrandAsset(
  file: File
): Promise<{
  url: string;
  fileName: string;
  mimeType: string;
  path: string;
}> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<{
    url: string;
    fileName: string;
    mimeType: string;
    path: string;
  }>("/brand-settings/upload/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return {
    url: data.url,
    fileName: data.fileName,
    mimeType: data.mimeType,
    path: data.path,
  };
}
