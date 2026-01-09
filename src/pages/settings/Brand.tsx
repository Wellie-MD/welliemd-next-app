import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { X, Upload, Image as ImageIcon, Plus, Trash2, Facebook, Twitter } from "lucide-react"

interface UploadFieldProps {
  label: string
  description?: string
  accept?: string
  maxSize?: string
  onFileSelect?: (file: File | null) => void
}

const FileUploadField = ({ label, description, accept, maxSize, onFileSelect }: UploadFieldProps) => {
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
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver 
            ? 'border-sky-400 bg-sky-50' 
            : selectedFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Upload className="w-6 h-6 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-600">
                <button
                  type="button"
                  className="text-sky-600 hover:text-sky-700 font-medium"
                  onClick={() => document.getElementById(`file-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
                >
                  Choose a file
                </button>
                <span> or drag it here</span>
              </div>
              {maxSize && (
                <p className="text-xs text-muted-foreground">
                  File size limit: {maxSize}
                </p>
              )}
            </div>
          </>
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

// Color Palette Component
const ColorPaletteSection = ({ title, colors, onColorChange }: { title: string, colors: string[], onColorChange?: (color: string) => void }) => {
  const [selectedColor, setSelectedColor] = useState(colors[0])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onColorChange?.(color)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color, index) => (
          <button
            key={index}
            type="button"
            className={`w-8 h-8 rounded border-2 ${
              selectedColor === color ? 'border-gray-400' : 'border-gray-200'
            } hover:border-gray-300 transition-colors`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
          />
        ))}
      </div>
    </div>
  )
}

export default function Brand() {
  const [formData, setFormData] = useState({
    homePageUrl: "patients.com",
    helpPageSlug: "welliemd.com/help",
    enabledNotifications: {
      smsCompleted: true,
      smsNoShow: false,
      smsNoTreatment: true,
    }
  })

  const [socialLinks, setSocialLinks] = useState([
    { platform: "Facebook", url: "https://facebook.com/welliemd", enabled: true },
    { platform: "Twitter", url: "https://twitter.com/welliemd", enabled: false }
  ])

  const [customAds, setCustomAds] = useState([
    { title: "Ad 1", content: "Your custom ad content here" }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Brand settings saved:", formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "", enabled: false }])
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const updateSocialLink = (index: number, field: string, value: string | boolean) => {
    setSocialLinks(socialLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ))
  }

  const addCustomAd = () => {
    setCustomAds([...customAds, { title: "", content: "" }])
  }

  const removeCustomAd = (index: number) => {
    setCustomAds(customAds.filter((_, i) => i !== index))
  }

  const updateCustomAd = (index: number, field: string, value: string) => {
    setCustomAds(customAds.map((ad, i) => 
      i === index ? { ...ad, [field]: value } : ad
    ))
  }

  return (
    <div className="mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Brand</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Configure Your Brand Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Configure Your Brand</h2>
              <p className="text-sm text-muted-foreground">
                Customize what your patients see when they receive a prescription.
              </p>
            </div>

            {/* Logo Section */}
            <div>
              <h3 className="text-base font-medium mb-4">Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadField
                  label="Square Logo"
                  accept="image/*"
                  maxSize="10 MB"
                />
                <FileUploadField
                  label="Round Logo"
                  accept="image/*"
                  maxSize="10 MB"
                />
                <FileUploadField
                  label="Transparent Logo"
                  accept="image/*"
                  maxSize="10 MB"
                />
                <FileUploadField
                  label="Favicon"
                  accept="image/*"
                  maxSize="10 MB"
                />
              </div>
            </div>

            {/* Pages Section */}
            <div>
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

        {/* Get Account Link Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Get Account Link</h2>
              <p className="text-sm text-muted-foreground">
                Links to various pages that be shared for created or account.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="home-page-url" className="text-sm font-medium">
                  Home page url
                </Label>
                <Input
                  id="home-page-url"
                  value={formData.homePageUrl}
                  onChange={(e) => handleInputChange('homePageUrl', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>

              <div>
                <Label htmlFor="help-page-slug" className="text-sm font-medium">
                  Help page slug
                </Label>
                <Input
                  id="help-page-slug"
                  value={formData.helpPageSlug}
                  onChange={(e) => handleInputChange('helpPageSlug', e.target.value)}
                  className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Page Image Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium">Login Page Image</h2>
            </div>

            <div className="max-w-lg">
              <FileUploadField
                label="Drag and drop an image file here or Browse"
                accept="image/*"
                maxSize="10 MB"
              />
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
                colors={['#3B82F6', '#1E40AF', '#1D4ED8', '#2563EB', '#3730A3', '#4338CA', '#5B21B6', '#7C3AED']} 
              />
              <ColorPaletteSection 
                title="Secondary Colors" 
                colors={['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#6B7280', '#4B5563', '#374151']} 
              />
              <ColorPaletteSection 
                title="Accent Colors" 
                colors={['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#EF4444', '#DC2626', '#B91C1C']} 
              />
              <ColorPaletteSection 
                title="Neutral Colors" 
                colors={['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#111827']} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient Portal Experience Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Patient Portal Experience</h2>
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    enabledNotifications: {
                      ...prev.enabledNotifications,
                      smsCompleted: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-completed" className="text-sm">SMS - Completed telehealth</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sms-no-show"
                  checked={formData.enabledNotifications.smsNoShow}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    enabledNotifications: {
                      ...prev.enabledNotifications,
                      smsNoShow: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-no-show" className="text-sm">SMS - No show telehealth</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sms-no-treatment"
                  checked={formData.enabledNotifications.smsNoTreatment}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    enabledNotifications: {
                      ...prev.enabledNotifications,
                      smsNoTreatment: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <Label htmlFor="sms-no-treatment" className="text-sm">SMS - Patient finished from treatment</Label>
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
                  Redirect links to the different social media via Patient Portal.
                </p>
              </div>
              <Button type="button" onClick={addSocialLink} size="sm" className="bg-sky-500 hover:bg-sky-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            </div>

            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <Switch 
                      checked={link.enabled}
                      onCheckedChange={(checked) => updateSocialLink(index, 'enabled', checked)}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Platform name"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
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

        {/* Help Page Section */}
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
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium">Custom Ads</h2>
                <p className="text-sm text-muted-foreground">
                  Reach users with the your Patients.
                </p>
              </div>
              <Button type="button" onClick={addCustomAd} size="sm" className="bg-sky-500 hover:bg-sky-600">
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
                      onChange={(e) => updateCustomAd(index, 'title', e.target.value)}
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
                    onChange={(e) => updateCustomAd(index, 'content', e.target.value)}
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
            className="bg-sky-500 hover:bg-sky-600 text-white px-8"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
