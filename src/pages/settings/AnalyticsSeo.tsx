import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Image as ImageIcon, X } from "lucide-react"

interface FileUploadFieldProps {
  label: string
  description?: string
  accept?: string
  maxSize?: string
  onFileSelect?: (file: File | null) => void
}

const FileUploadField = ({ label, description, accept, maxSize, onFileSelect }: FileUploadFieldProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

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
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileSelect(file)
  }

  const removeFile = () => {
    handleFileSelect(null)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver 
            ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30' 
            : selectedFile 
              ? 'border-green-300 bg-green-50 dark:bg-emerald-900/20' 
              : 'border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-sm text-gray-700 dark:text-slate-200 truncate">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          onChange={handleInputChange}
        />
      </div>
    </div>
  )
}

export default function AnalyticsSeo() {
  const [formData, setFormData] = useState({
    googleAnalyticsId: "G-XXRWX3TPKC",
    googleTagManagerId: "GTM-N4JBP9WUW",
    defaultTitle: "Telehealth",
    defaultDescription: "Description",
    pageTitle: "Stretohealth mypatient health",
    socialSharePreview: ""
  })

  const [characterCount, setCharacterCount] = useState(formData.defaultDescription.length)
  const maxCharacters = 320

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Analytics & SEO settings saved:", formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'defaultDescription') {
      setCharacterCount(value.length)
    }
  }

  return (
    <div className="mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics & SEO</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Google Analytics and Tag Manager Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Google Analytics and Tag Manager</h2>
              <p className="text-sm text-muted-foreground">
                Google Analytics enables you to track visitors to your website, collecting anonymous analytics regarding how users go through your telehealth visit. It also helps to generate reports that will help you with your marketing.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Google Tag Manager</strong> is a tag management system (TMS) that enables you to customize the data that is collected and where that data is sent. The container can be configured to send data to numerous places including Facebook, TikTok and Twitter for advertising purposes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Google Analytics ID</Label>
                <Input
                  value={formData.googleAnalyticsId}
                  onChange={(e) => handleInputChange('googleAnalyticsId', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  placeholder="G-XXXXXXXXXX"
                />
                <div className="flex justify-end mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-sky-600 border-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-700 dark:hover:bg-sky-900/30"
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Google Tag Manager ID</Label>
                <Input
                  value={formData.googleTagManagerId}
                  onChange={(e) => handleInputChange('googleTagManagerId', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  placeholder="GTM-XXXXXXX"
                />
                <div className="flex justify-end mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-sky-600 border-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-700 dark:hover:bg-sky-900/30"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Title and Meta Description Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Title and Meta description</h2>
              <p className="text-sm text-muted-foreground">
                The title and meta description help define how your store shows up on search engines.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Default Title</Label>
                <Input
                  value={formData.defaultTitle}
                  onChange={(e) => handleInputChange('defaultTitle', e.target.value)}
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
                  value={formData.defaultDescription}
                  onChange={(e) => handleInputChange('defaultDescription', e.target.value)}
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
                When you share a link to your store on social media, an image is usually shown in your post. This one will be used if another relevant image can't be found.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FileUploadField
                  label="Social sharing image"
                  description="When you share a link to your store on social media, an image is usually shown in your post. This one will be used if another relevant image can't be found."
                  accept="image/*"
                  maxSize="1200 x 628 px"
                />
                <div className="mt-4">
                  <Button 
                    type="button" 
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    Change Image
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Social Share Preview</h3>
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Page Title</Label>
                        <Input
                          value={formData.pageTitle}
                          onChange={(e) => handleInputChange('pageTitle', e.target.value)}
                          className="mt-1 text-sm focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                          placeholder="Stretohealth mypatient health"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta description</Label>
                        <div className="text-sm text-gray-600 dark:text-slate-300 mt-1 p-2 bg-white dark:bg-slate-950 border rounded dark:border-slate-700">
                          {formData.defaultDescription || "Meta description"}
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
            className="bg-sky-500 hover:bg-sky-600 text-white px-8"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
