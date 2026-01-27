import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Facebook,
} from "lucide-react";
import {
  fetchBrandSettings,
  updateBrandSettings,
} from "@/api/brandSettingsApi";
import { messageService } from "@/services/messageService";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
// import { messageService } from "@/services/messageService"
// import api from "@/services/api"

interface UploadFieldProps {
  label: string;
  accept?: string;
  maxSize?: string;
  currentUrl?: string;
  onFileSelect?: (file: File | null) => void;
}

const FileUploadField = ({
  label,
  accept,
  maxSize,
  currentUrl,
  onFileSelect,
}: UploadFieldProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? "border-sky-400 bg-sky-50"
            : selectedFile || currentUrl
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
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
            <div className="relative w-24 h-24 border rounded bg-white overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={displayUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                // This prevents the alt text from showing if the image fails
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            <div className="flex items-center justify-between w-full p-2 bg-white rounded border">
              <div className="flex items-center gap-2 overflow-hidden">
                <ImageIcon className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {selectedFile ? selectedFile.name : "File currently saved"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFileSelect(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-6 h-6 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-600">
              <button
                type="button"
                className="text-sky-600 font-medium"
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
  onColorChange,
}: {
  title: string;
  colors: string[];
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
              selectedColor === color ? "border-gray-400" : "border-gray-200"
            } hover:border-gray-300 transition-colors`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default function Brand() {
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState([
    {
      platform: "Facebook",
      url: "https://facebook.com/welliemd",
      enabled: true,
    },
    {
      platform: "Twitter",
      url: "https://twitter.com/welliemd",
      enabled: false,
    },
  ]);

  const [customAds, setCustomAds] = useState([
    { title: "Ad 1", content: "Your custom ad content here" },
  ]);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "", enabled: false }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    setSocialLinks(
      socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    );
  };

  const addCustomAd = () => {
    setCustomAds([...customAds, { title: "", content: "" }]);
  };

  const removeCustomAd = (index: number) => {
    setCustomAds(customAds.filter((_, i) => i !== index));
  };

  const updateCustomAd = (index: number, field: string, value: string) => {
    setCustomAds(
      customAds.map((ad, i) => (i === index ? { ...ad, [field]: value } : ad)),
    );
  };

  const [formData, setFormData] = useState({
    homePageUrl: "patients.com",
    helpPageSlug: "welliemd.com/help",
    logos: { square: "", round: "", transparent: "", favicon: "" },
    loginPageImage: "",
    support: {
      phone: "(833) 937-7363",
      email: "support@welliemd.com",
      hours: "",
    },
    enabledNotifications: {
      smsCompleted: true,
      smsNoShow: false,
      smsNoTreatment: true,
    },
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
          const logoKey = path.split(".")[1];
          return {
            ...prev,
            logos: {
              ...prev.logos,
              [logoKey]: "", // Clear the saved URL
            },
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

      // Upload pending files using messageService
      for (const [path, file] of Object.entries(filesToUpload)) {
        console.log({ path, file });

        const { url } = await messageService.uploadAttachment(file);
        if (path.startsWith("logos."))
          (updatedLogos as any)[path.split(".")[1]] = url;
        if (path === "loginPageImage") updatedLoginImg = url;
      }

      await updateBrandSettings({
        ...formData,
        logos: updatedLogos,
        loginPageImage: updatedLoginImg,
      });
      toast({
        title: "Success",
        description: "Brand assets updated!",
        variant: "default",
      });
      // alert("Brand assets updated!");
      setFilesToUpload({});
    } catch (err) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-8 p-6">
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
              {["square", "round", "transparent", "favicon"].map((key) => (
                <FileUploadField
                  key={key}
                  label={`${key.charAt(0).toUpperCase() + key.slice(1)} Logo`}
                  accept="image/*"
                  currentUrl={(formData.logos as any)[key]}
                  onFileSelect={(f) => handleFileChange(`logos.${key}`, f)}
                />
              ))}
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

        {/* Support & Links (Simple Text) */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Get Account Link</h2>
              <p className="text-sm text-muted-foreground">
                Links to various pages that be shared for created or account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Home URL</Label>
                <Input
                  value={formData.homePageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, homePageUrl: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Help Slug</Label>
                <Input
                  value={formData.helpPageSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, helpPageSlug: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Login Page Image */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium">Login Page Image</h2>
            <FileUploadField
              label="Main Login Image"
              accept="image/*"
              currentUrl={formData.loginPageImage}
              onFileSelect={(f) => handleFileChange("loginPageImage", f)}
            />
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
                colors={[
                  "#3B82F6",
                  "#1E40AF",
                  "#1D4ED8",
                  "#2563EB",
                  "#3730A3",
                  "#4338CA",
                  "#5B21B6",
                  "#7C3AED",
                ]}
              />
              <ColorPaletteSection
                title="Secondary Colors"
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient Portal Experience Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">
                Patient Portal Experience
              </h2>
              <p className="text-sm text-muted-foreground">
                Have your patients have better experience.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sms-completed"
                  checked={formData.enabledNotifications.smsCompleted}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enabledNotifications: {
                        ...prev.enabledNotifications,
                        smsCompleted: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-completed" className="text-sm">
                  SMS - Completed telehealth
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sms-no-show"
                  checked={formData.enabledNotifications.smsNoShow}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enabledNotifications: {
                        ...prev.enabledNotifications,
                        smsNoShow: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-no-show" className="text-sm">
                  SMS - No show telehealth
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sms-no-treatment"
                  checked={formData.enabledNotifications.smsNoTreatment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enabledNotifications: {
                        ...prev.enabledNotifications,
                        smsNoTreatment: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-no-treatment" className="text-sm">
                  SMS - Patient finished from treatment
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Info Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Support Info</h2>
              <p className="text-sm text-muted-foreground">
                Helping support information for your patients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  placeholder="(833) 937-7363"
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  placeholder="support@welliemd.com"
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Support Hours</Label>
              <Textarea
                placeholder="Monday-Friday 9am-5pm EST. We'll get back to you as soon as possible during business hours. For urgent medical questions, please contact your healthcare provider directly or call 911 in case of an emergency."
                rows={4}
                className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium">Social Links</h2>
                <p className="text-sm text-muted-foreground">
                  Redirect links to the different social media via Patient
                  Portal.
                </p>
              </div>
              <Button
                type="button"
                onClick={addSocialLink}
                size="sm"
                className="bg-sky-500 hover:bg-sky-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            </div>

            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <Switch
                      checked={link.enabled}
                      onCheckedChange={(checked) =>
                        updateSocialLink(index, "enabled", checked)
                      }
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Platform name"
                      value={link.platform}
                      onChange={(e) =>
                        updateSocialLink(index, "platform", e.target.value)
                      }
                      className="focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) =>
                        updateSocialLink(index, "url", e.target.value)
                      }
                      className="focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium">Help page</h2>
              <p className="text-sm text-muted-foreground">
                Just ask doubt and Help page will show.
              </p>
            </div>
            {/* Additional help page content would go here */}
          </CardContent>
        </Card>

        {/* Custom Ads Section */}
        <Card className="hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium">Custom Ads</h2>
                <p className="text-sm text-muted-foreground">
                  Reach users with the your Patients.
                </p>
              </div>
              <Button
                type="button"
                onClick={addCustomAd}
                size="sm"
                className="bg-sky-500 hover:bg-sky-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ad
              </Button>
            </div>

            <div className="space-y-4">
              {customAds.map((ad, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <Input
                      placeholder="Ad Title"
                      value={ad.title}
                      onChange={(e) =>
                        updateCustomAd(index, "title", e.target.value)
                      }
                      className="flex-1 mr-4 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomAd(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Ad content..."
                    value={ad.content}
                    onChange={(e) =>
                      updateCustomAd(index, "content", e.target.value)
                    }
                    rows={3}
                    className="focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                  <FileUploadField
                    label="Ad Image"
                    accept="image/*"
                    maxSize="5 MB"
                  />
                </div>
              ))}
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
    </div>
  );
}

