import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Image as ImageIcon, X } from "lucide-react"
import { fetchBrandSettings, updateBrandSettings, type BrandSettings } from "@/api/brandSettingsApi"
import { uploadBrandAsset } from "@/services/brandAssetsService"
import { toast } from "@/hooks/use-toast"

interface FileUploadFieldProps {
  label: string
  description?: string
  accept?: string
  maxSize?: string
  currentUrl?: string
  onFileSelect?: (file: File | null) => void
}

const FileUploadField = ({ label, description, accept, maxSize, currentUrl, onFileSelect }: FileUploadFieldProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    setSelectedFile(null)
  }, [currentUrl])

  const getDisplayUrl = () => {
    if (selectedFile) return URL.createObjectURL(selectedFile)
    if (currentUrl && currentUrl.includes("localstack")) return currentUrl.replace("localstack", "localhost")
    return currentUrl
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileSelect(files[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileSelect(file)
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    handleFileSelect(null)
    const input = document.getElementById(`file-${label.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement
    if (input) input.value = ''
  }

  const displayUrl = getDisplayUrl()

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver 
            ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30' 
            : selectedFile || currentUrl
              ? 'border-green-300 bg-green-50 dark:bg-emerald-900/20' 
              : 'border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile || currentUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full h-32 border rounded bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={displayUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
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
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 ml-2 p-1 relative z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 dark:text-slate-500 mx-auto" />
            <div className="text-sm text-gray-600 dark:text-slate-300">
              <span>Drag and drop an image file here or </span>
              <button
                type="button"
                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium underline"
                onClick={() => document.getElementById(`file-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
              >
                Browse
              </button>
            </div>
            {maxSize && (
              <p className="text-xs text-muted-foreground">
                Image (Recommended size: {maxSize})
              </p>
            )}
          </div>
        )}
        
        <input
          id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
        />
      </div>
    </div>
  )
}

export default function AnalyticsSeo() {
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    seoTitle: "",
    seoDescription: "",
    seoImage: ""
  })
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  const [characterCount, setCharacterCount] = useState(0)
  const maxCharacters = 320

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const brandData = await fetchBrandSettings()
        setBrandSettings(brandData)
        setFormData({
          seoTitle: brandData.seoTitle || "",
          seoDescription: brandData.seoDescription || "",
          seoImage: brandData.seoImage || ""
        })
        setCharacterCount(brandData.seoDescription?.length || 0)
      } catch (err) {
        console.error("Failed to load brand settings", err)
      } finally {
        setIsLoadingData(false)
      }
    }
    loadSettings()
  }, [])

  const handleFileChange = (file: File | null) => {
    setFileToUpload(file)
    if (!file) {
      setFormData(prev => ({ ...prev, seoImage: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandSettings) return

    setLoading(true)
    try {
      let updatedSeoImage = formData.seoImage

      if (fileToUpload) {
        const { url } = await uploadBrandAsset(fileToUpload)
        updatedSeoImage = url
      }

      const updatedSettings = {
        ...brandSettings,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoImage: updatedSeoImage
      }

      await updateBrandSettings(updatedSettings)
      
      setBrandSettings(updatedSettings)
      setFormData(prev => ({ ...prev, seoImage: updatedSeoImage }))
      setFileToUpload(null)

      toast({
        title: "Success",
        description: "SEO settings updated!",
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'seoDescription') {
      setCharacterCount(value.length)
    }
  }

  if (isLoadingData) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SEO</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title and Meta Description Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Title and Meta description</h2>
              <p className="text-sm text-muted-foreground">
                The title and meta description help define how your store shows up on search engines and social media.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Default Title</Label>
                <Input
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  placeholder="Enter default title"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 70 characters used.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Default meta description</Label>
                <Textarea
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  placeholder="Description"
                  rows={4}
                  maxLength={maxCharacters}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    0 of {maxCharacters} characters used
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Social sharing image</h2>
              <p className="text-sm text-muted-foreground">
                When you share a link to your store on social media, an image is usually shown in your post.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FileUploadField
                  label="Social sharing image"
                  description="This one will be used if another relevant image can't be found."
                  accept="image/*"
                  maxSize="1200 x 628 px"
                  currentUrl={formData.seoImage}
                  onFileSelect={handleFileChange}
                />
                {(fileToUpload || formData.seoImage) && (
                  <div className="mt-4">
                    <Button 
                      type="button" 
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={() => document.getElementById(`file-social-sharing-image`)?.click()}
                    >
                      Change Image
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Social Share Preview</h3>
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Page Title</Label>
                        <div className="text-sm font-semibold mt-1 p-2 bg-white dark:bg-slate-950 border rounded dark:border-slate-700">
                          {formData.seoTitle || "Page Title"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta description</Label>
                        <div className="text-sm text-gray-600 dark:text-slate-300 mt-1 p-2 bg-white dark:bg-slate-950 border rounded dark:border-slate-700">
                          {formData.seoDescription || "Meta description"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 text-white px-8"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
