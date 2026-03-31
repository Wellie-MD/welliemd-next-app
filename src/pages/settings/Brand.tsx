import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchBrandSettings,
  updateBrandSettings,
  type BrandSettings,
  type BrandLogos,
} from "@/api/brandSettingsApi";
import { uploadBrandAsset } from "@/services/brandAssetsService";
import { toast } from "@/hooks/use-toast";

interface UploadFieldProps {
  label: string;
  accept?: string;
  maxSize?: string;
  currentUrl?: string;
  onFileSelect?: (file: File | null) => void;
  recommendedResolution?: string;
  description?: string;
}

const FileUploadField = ({
  label,
  accept,
  maxSize,
  currentUrl,
  onFileSelect,
  recommendedResolution,
  description,
}: UploadFieldProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // When the parent updates currentUrl (e.g. after a successful save),
  // drop the local File so the component switches to the server URL.
  useEffect(() => {
    setSelectedFile(null);
  }, [currentUrl]);

  // Helper to fix LocalStack URLs for the browser
  const getDisplayUrl = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (currentUrl && currentUrl.includes("localstack")) {
      return currentUrl.replace("localstack", "localhost");
    }
    return currentUrl;
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const displayUrl = getDisplayUrl();

  useEffect(() => {
    // If we have a local file, we create a URL.
    // This cleanup ensures we "free" that memory when the component changes.
    return () => {
      if (displayUrl && displayUrl.startsWith("blob:")) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [displayUrl]);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {recommendedResolution && (
          <span className="text-xs font-medium text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded">
            {recommendedResolution}
          </span>
        )}
      </div>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver
            ? "border-sky-400 bg-sky-50 dark:bg-sky-900/30"
            : selectedFile || currentUrl
              ? "border-green-300 bg-green-50 dark:bg-emerald-900/20"
              : "border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0])
            handleFileSelect(e.dataTransfer.files[0]);
        }}
      >
        {selectedFile || currentUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* Image Preview Container */}
            <div className="relative w-24 h-24 border rounded bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={displayUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                // This prevents the alt text from showing if the image fails
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-slate-900 rounded border dark:border-slate-700">
              <div className="flex items-center gap-2 overflow-hidden">
                <ImageIcon className="w-4 h-4 text-gray-500 dark:text-slate-400 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-slate-200 truncate">
                  {selectedFile ? selectedFile.name : "File currently saved"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFileSelect(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-6 h-6 text-gray-400 dark:text-slate-500 mx-auto" />
            <div className="text-sm text-gray-600 dark:text-slate-300">
              <button
                type="button"
                className="text-sky-600 dark:text-sky-400 font-medium"
                onClick={() =>
                  document.getElementById(`file-${label}`)?.click()
                }
              >
                Choose a file
              </button>
            </div>
            {maxSize && (
              <p className="text-xs text-muted-foreground">Max: {maxSize}</p>
            )}
          </div>
        )}
        <input
          id={`file-${label}`}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
};

// Color Palette Component
const ColorPaletteSection = ({
  title,
  colors,
  activeColor, // Add this
  onColorChange,
}: {
  title: string;
  colors: string[];
  activeColor: string; // Add this
  onColorChange?: (color: string) => void;
}) => {
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color, index) => (
          <button
            key={index}
            type="button"
            className={`w-8 h-8 rounded border-2 ${
              // Compare against the color from parent state
              activeColor === color
                ? "border-sky-500 scale-110 shadow-sm"
                : "border-gray-200"
              } hover:border-gray-300 transition-all`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange?.(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default function Brand() {
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState<BrandSettings>({
    logos: { square: "", round: "", transparent: "", favicon: "" },
    logosMeta: {},
    loginPageImage: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    accentColor: "#F59E0B",
    neutralColor: "#F3F4F6",
    patientPortalTheme: "light",
  });

  const [filesToUpload, setFilesToUpload] = useState<Record<string, File>>({});

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const brandData = await fetchBrandSettings();
        console.log({ brandData });

        if (brandData) setFormData((prev) => ({ ...prev, ...brandData }));
      } catch (err) {
        console.error("Load error", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchBrand();
  }, []);

  const handleFileChange = (path: string, file: File | null) => {
    // 1. Manage the files pending for upload
    if (file) {
      setFilesToUpload((prev) => ({ ...prev, [path]: file }));
    } else {
      setFilesToUpload((prev) => {
        const updated = { ...prev };
        delete updated[path];
        return updated;
      });

      // 2. Clear the current URL in formData so the UI resets
      setFormData((prev) => {
        if (path.startsWith("logos.")) {
          const logoKey = path.split(".")[1] as keyof BrandLogos;
          const nextMeta = { ...(prev.logosMeta || {}) };
          delete nextMeta[logoKey];
          return {
            ...prev,
            logos: {
              ...prev.logos,
              [logoKey]: "", // Clear the saved URL
            },
            logosMeta: nextMeta,
          };
        }
        // Handle top-level fields like loginPageImage
        return {
          ...prev,
          [path]: "",
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedLogos = { ...formData.logos };
      let updatedLoginImg = formData.loginPageImage;
      let updatedLogosMeta = { ...(formData.logosMeta || {}) };

      // Upload all pending files in parallel for speed
      const entries = Object.entries(filesToUpload);
      if (entries.length > 0) {
        const results = await Promise.all(
          entries.map(async ([path, file]) => {
            const { url, path: s3Key } = await uploadBrandAsset(file);
            return { path, url, s3Key };
          }),
        );

        for (const { path, url, s3Key } of results) {
          if (path.startsWith("logos.")) {
            const slot = path.split(".")[1] as keyof BrandLogos;
            updatedLogos[slot] = url;
            updatedLogosMeta = {
              ...updatedLogosMeta,
              [slot]: { s3Key },
            };
          }
          if (path === "loginPageImage") updatedLoginImg = url;
        }
      }

      await updateBrandSettings({
        ...formData,
        logos: updatedLogos,
        loginPageImage: updatedLoginImg,
        logosMeta: updatedLogosMeta,
      });

      // Sync local state with what was actually saved so subsequent
      // saves (or a page-stay) don't revert to stale/empty values.
      setFormData((prev) => ({
        ...prev,
        logos: updatedLogos,
        loginPageImage: updatedLoginImg,
        logosMeta: updatedLogosMeta,
      }));

      toast({
        title: "Success",
        description: "Brand assets updated!",
        variant: "default",
      });
      setFilesToUpload({});
    } catch (err) {
      toast({
        title: "Error",
        description: "Save failed!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-8 p-6">
      {!isLoadingData && (
        <>
          <h1 className="text-2xl font-semibold">Brand Configuration</h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Section */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-1">Configure Your Brand</h2>
                  <p className="text-sm text-muted-foreground">
                    Customize what your patients see when they receive a
                    prescription.
                  </p>
                </div>
                <h2 className="text-lg font-medium">Logos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUploadField
                    label="Square Logo"
                    accept="image/*"
                    currentUrl={formData.logos.square}
                    onFileSelect={(f) => handleFileChange(`logos.square`, f)}
                    recommendedResolution="500×100px"
                    description="Used in header and sidebar. Wide horizontal format works best."
                  />
                  <FileUploadField
                    label="Favicon Logo"
                    accept="image/*"
                    currentUrl={formData.logos.favicon}
                    onFileSelect={(f) => handleFileChange(`logos.favicon`, f)}
                    recommendedResolution="32×32px or 64×64px"
                    description="Browser tab icon. Square format required."
                  />
                  {/* Pages Section */}
                </div>
                <div className="hidden">
                  <h3 className="text-base font-medium mb-4">Pages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField
                      label="How It Works"
                      accept=".pdf,.doc,.docx"
                      maxSize="10 MB"
                    />
                    <FileUploadField
                      label="FAQs"
                      accept=".pdf,.doc,.docx"
                      maxSize="10 MB"
                    />
                    <FileUploadField
                      label="Testimonials"
                      accept=".pdf,.doc,.docx"
                      maxSize="10 MB"
                    />
                    <FileUploadField
                      label="Pricing"
                      accept=".pdf,.doc,.docx"
                      maxSize="10 MB"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Color Palette Section */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium">Color Palette</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPaletteSection
                    title="Primary Colors"
                    activeColor={formData.primaryColor}
                    onColorChange={(color) =>
                      setFormData({ ...formData, primaryColor: color })
                    }
                    colors={[
                      "#3B82F6",
                      "#1E40AF",
                      "#1D4ED8",
                      "#2563EB",
                      "#3730A3",
                      "#4338CA",
                      "#5B21B6",
                      "#7C3AED",
                      "#10B981",
                      "#059669",
                      "#047857",
                      "#065F46",
                      "#064E3B",
                      "#6B7280",
                      "#4B5563",
                      "#374151",
                      "#F59E0B",
                      "#D97706",
                      "#B45309",
                      "#92400E",
                      "#78350F",
                      "#EF4444",
                      "#DC2626",
                      "#B91C1C",
                      "#F3F4F6",
                      "#E5E7EB",
                      "#D1D5DB",
                      "#9CA3AF",
                      "#6B7280",
                      "#4B5563",
                      "#374151",
                      "#111827",
                    ]}
                  />
                  {/* <ColorPaletteSection
                title="Secondary Colors"
                onColorChange={(color) => setFormData({ ...formData, secondaryColor: color })}
                activeColor={formData.secondaryColor}
                colors={[
                  "#10B981",
                  "#059669",
                  "#047857",
                  "#065F46",
                  "#064E3B",
                  "#6B7280",
                  "#4B5563",
                  "#374151",
                ]}
              />
              <ColorPaletteSection
                title="Accent Colors"
                activeColor={formData.accentColor}
                onColorChange={(color) => setFormData({ ...formData, accentColor: color })}
                colors={[
                  "#F59E0B",
                  "#D97706",
                  "#B45309",
                  "#92400E",
                  "#78350F",
                  "#EF4444",
                  "#DC2626",
                  "#B91C1C",
                ]}
              />
              <ColorPaletteSection
                title="Neutral Colors"
                activeColor={formData.neutralColor}
                onColorChange={(color) =>
                  setFormData({ ...formData, neutralColor: color })
                }
                colors={[
                  "#F3F4F6",
                  "#E5E7EB",
                  "#D1D5DB",
                  "#9CA3AF",
                  "#6B7280",
                  "#4B5563",
                  "#374151",
                  "#111827",
                ]}
              /> */}
                </div>
              </CardContent>
            </Card>

            {/* Patient Portal Theme */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-medium">Patient Portal Theme</h2>
                  <p className="text-sm text-muted-foreground">
                    Select the default theme patients see when they visit the
                    portal.
                  </p>
                </div>
                <div className="max-w-sm">
                  <Label className="text-sm font-medium">Default Theme</Label>
                  <Select
                    value={formData.patientPortalTheme}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        patientPortalTheme: value as "light" | "dark",
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-sky-500 text-white px-10"
              >
                {loading ? "Uploading Images..." : "Save Brand Assets"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
