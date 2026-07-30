import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IntakeResponseSummary, PatientResponses, QuestionnairePhoto, updateOrderQuestionnaireImages } from "@/api/ordersApi"
import { User, FileText, Pill, AlertCircle, Link2, Copy, Image as ImageIcon, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef, useState } from "react"

interface PatientResponsesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientResponses: PatientResponses | null | undefined
  intakeResponseSummary?: IntakeResponseSummary | null
  patientName?: string
  checkoutUrl?: string | null
  orderId?: string
  onImagesSaved?: (photos: QuestionnairePhoto[]) => void
}

export function PatientResponsesModal({
  open,
  onOpenChange,
  patientResponses,
  intakeResponseSummary,
  patientName = "Patient",
  checkoutUrl,
  orderId,
  onImagesSaved,
}: PatientResponsesModalProps) {
  const { toast } = useToast()
  const [imageItems, setImageItems] = useState<QuestionnairePhoto[]>([])
  const [isSavingImages, setIsSavingImages] = useState(false)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const handleCopyCheckoutUrl = () => {
    if (!checkoutUrl) return
    navigator.clipboard.writeText(checkoutUrl)
    toast({
      title: "Copied",
      description: "Checkout URL copied to clipboard.",
    })
  }

  useEffect(() => {
    if (!open) return

    const nextItems: QuestionnairePhoto[] = []
    const rawPhotos = Array.isArray(patientResponses?.photos) ? patientResponses?.photos : []

    for (const item of rawPhotos) {
      if (!item || typeof item !== "object") continue
      const photo = item as Record<string, unknown>
      const question = String(photo.question || "").trim()
      nextItems.push({
        question: question || "",
        question_id: String(photo.question_id || ""),
        mime: String(photo.mime || "image/jpeg"),
        data: typeof photo.data === "string" ? photo.data : "",
      })
    }

    if (nextItems.length === 0) {
      const legacyUploads = (patientResponses as Record<string, unknown> | null | undefined)?._image_uploads
      if (Array.isArray(legacyUploads)) {
        legacyUploads.forEach((legacyItem, idx) => {
          if (!legacyItem || typeof legacyItem !== "object") return
          const legacy = legacyItem as Record<string, unknown>
          nextItems.push({
            question: `Uploaded Image ${idx + 1}`,
            question_id: "",
            mime: String(legacy.mime || "image/jpeg"),
            data: typeof legacy.data === "string" ? legacy.data : "",
          })
        })
      }
    }

    setImageItems(nextItems)
  }, [open, patientResponses])

  const hasImageChanges = (() => {
    const initialPhotos = Array.isArray(patientResponses?.photos) ? patientResponses.photos : []
    if (initialPhotos.length !== imageItems.length) return true

    for (let i = 0; i < imageItems.length; i += 1) {
      const left = imageItems[i] || {}
      const rightRaw = initialPhotos[i]
      const right = (rightRaw && typeof rightRaw === "object") ? rightRaw as Record<string, unknown> : {}
      if (
        String(left.question || "") !== String(right.question || "") ||
        String(left.question_id || "") !== String(right.question_id || "") ||
        String(left.mime || "") !== String(right.mime || "") ||
        String(left.data || "") !== String(right.data || "")
      ) {
        return true
      }
    }
    return false
  })()

  const updateImageAt = (index: number, next: QuestionnairePhoto) => {
    setImageItems((prev) => prev.map((item, idx) => (idx === index ? next : item)))
  }

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      const base64Data = result.includes(",") ? result.split(",")[1] : result
      const current = imageItems[index]
      if (!current) return
      updateImageAt(index, {
        ...current,
        mime: file.type || current.mime || "image/jpeg",
        data: base64Data || "",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (index: number) => {
    const current = imageItems[index]
    if (!current) return
    updateImageAt(index, { ...current, data: "" })
  }

  const handleSaveImages = async () => {
    if (!orderId) {
      toast({
        title: "Unable to save",
        description: "Order ID is missing.",
        variant: "destructive",
      })
      return
    }

    setIsSavingImages(true)
    try {
      const payloadPhotos = imageItems.map((item) => ({
        question: item.question || "",
        question_id: item.question_id || "",
        mime: item.mime || "image/jpeg",
        data: item.data || "",
      }))

      const response = await updateOrderQuestionnaireImages(orderId, { photos: payloadPhotos })
      setImageItems(response.photos || [])
      onImagesSaved?.(response.photos || [])
      toast({
        title: "Saved",
        description: "Uploaded images were updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not update uploaded images.",
        variant: "destructive",
      })
      console.error("Failed to save questionnaire images:", error)
    } finally {
      setIsSavingImages(false)
    }
  }

  if (!patientResponses && !intakeResponseSummary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Patient Responses - {patientName}</DialogTitle>
          </DialogHeader>
          {checkoutUrl && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-lg">Checkout page URL</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  Copy and send this link to the patient if they did not receive the checkout email.
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={checkoutUrl}
                    className="font-mono text-sm flex-1 bg-background border-border/50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleCopyCheckoutUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No questionnaire responses available for this order.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Extract formObj from the beluga payload - this is where Q/A pairs are stored
  const safePatientResponses = patientResponses || {}
  const rawFormObj = safePatientResponses.formObj || safePatientResponses.questionnaireItems
  const formObj: Record<string, unknown> = (rawFormObj && typeof rawFormObj === 'object' && !Array.isArray(rawFormObj)) 
    ? rawFormObj as Record<string, unknown> 
    : {}
  const patientInfo = safePatientResponses.patientInfo || {}

  // Convert formObj Q1/A1, Q2/A2 format to array
  const questionsArray: { question: string; answer: string }[] = []
  
  if (!intakeResponseSummary && formObj && typeof formObj === 'object') {
    // Handle Q1/A1, Q2/A2 format from Beluga formObj
    const keys = Object.keys(formObj).filter(k => k.startsWith('Q'))
    keys.sort((a, b) => {
      const numA = parseInt(a.replace('Q', ''))
      const numB = parseInt(b.replace('Q', ''))
      return numA - numB
    })
    keys.forEach(qKey => {
      const aKey = qKey.replace('Q', 'A')
      const question = formObj[qKey]
      const answer = formObj[aKey]
      if (question && answer !== undefined) {
        questionsArray.push({
          question: String(question),
          answer: String(answer)
        })
      }
    })
  }
  if (intakeResponseSummary) {
    intakeResponseSummary.sections.forEach((section) => {
      section.responses.forEach((response) => {
        questionsArray.push({
          question: response.question,
          answer: typeof response.answer === "string"
            ? response.answer
            : JSON.stringify(response.answer),
        })
      })
    })
  }

  // Helper to format height from object or string
  const formatHeight = (height: unknown): string => {
    if (!height) return ''
    
    // If it's already a formatted string, return it
    if (typeof height === 'string') {
      // Check if it's a stringified object like "{'feet': 5, 'inches': 8}"
      if (height.includes('feet') && height.includes('inches')) {
        try {
          // Parse the Python-style dict (replace single quotes with double)
          const parsed = JSON.parse(height.replace(/'/g, '"'))
          if (parsed.feet !== undefined && parsed.inches !== undefined) {
            return `${parsed.feet}' ${parsed.inches}"`
          }
        } catch {
          // Try regex extraction
          const feetMatch = height.match(/feet['":\s]+(\d+)/)
          const inchesMatch = height.match(/inches['":\s]+(\d+)/)
          if (feetMatch && inchesMatch) {
            return `${feetMatch[1]}' ${inchesMatch[1]}"`
          }
        }
      }
      return height
    }
    
    // If it's an object with feet and inches
    if (typeof height === 'object' && height !== null) {
      const h = height as { feet?: number; inches?: number }
      if (h.feet !== undefined && h.inches !== undefined) {
        return `${h.feet}' ${h.inches}"`
      }
    }
    
    return String(height)
  }

  const normalizeText = (value: unknown): string =>
    String(value || "").trim().toLowerCase()

  const isNumericAnswer = (value: unknown): boolean =>
    /^\d+(\.\d+)?\s*(lbs?|pounds?)?$/i.test(String(value || "").trim())

  const parseHeightInches = (height: unknown): number | null => {
    if (!height) return null

    if (typeof height === "object" && height !== null) {
      const h = height as { feet?: number | string; inches?: number | string }
      const feet = Number(h.feet)
      const inches = Number(h.inches || 0)
      if (Number.isFinite(feet) && Number.isFinite(inches)) {
        return feet * 12 + inches
      }
    }

    const text = String(height).trim()
    if (!text) return null

    if (text.includes("feet") && text.includes("inches")) {
      const feetMatch = text.match(/feet['":\s]+(\d+)/)
      const inchesMatch = text.match(/inches['":\s]+(\d+)/)
      if (feetMatch) {
        return Number(feetMatch[1]) * 12 + Number(inchesMatch?.[1] || 0)
      }
    }

    const shorthandMatch = text.match(/(\d+)\s*'\s*(\d+)?/)
    if (shorthandMatch) {
      return Number(shorthandMatch[1]) * 12 + Number(shorthandMatch[2] || 0)
    }

    return null
  }

  const parseWeightPounds = (weight: unknown): number | null => {
    const match = String(weight || "").trim().match(/^(\d+(?:\.\d+)?)/)
    if (!match) return null
    const pounds = Number(match[1])
    return Number.isFinite(pounds) && pounds > 0 ? pounds : null
  }

  const calculateBmi = (height: unknown, weight: unknown): string => {
    const heightInches = parseHeightInches(height)
    const weightPounds = parseWeightPounds(weight)
    if (!heightInches || !weightPounds) return ""
    return ((weightPounds / (heightInches * heightInches)) * 703).toFixed(1)
  }

  const findAnswerByQuestion = (
    matcher: (question: string, answer: string) => boolean
  ): string => {
    for (const item of questionsArray) {
      const question = normalizeText(item.question)
      const answer = String(item.answer || "").trim()
      if (answer && matcher(question, answer)) {
        return answer
      }
    }
    return ""
  }

  const dobFromQuestion = findAnswerByQuestion((question) =>
    question === "date of birth" || question.includes("date of birth")
  )
  const heightFromQuestion = findAnswerByQuestion((question) =>
    question.includes("height") || question.includes("feet and inches")
  )
  const weightFromQuestion = findAnswerByQuestion((question, answer) =>
    question.includes("weight") &&
    !question.includes("weight management") &&
    isNumericAnswer(answer)
  )
  const bmiFromQuestion = findAnswerByQuestion((question, answer) =>
    (question.includes("bmi") || question.includes("body mass index")) &&
    isNumericAnswer(answer)
  )
  const resolvedHeight = patientInfo.height || heightFromQuestion
  const resolvedWeight = patientInfo.weight || weightFromQuestion
  const computedBmi = calculateBmi(resolvedHeight, resolvedWeight)

  // Extract patient info from formObj
  // Prefer explicit patientInfo, then label-aware Q/A values. Avoid assuming A3/A4
  // are always weight/BMI because older payloads can have different question order.
  const extractedPatientInfo = {
    dateOfBirth: patientInfo.dateOfBirth || dobFromQuestion,
    height: formatHeight(resolvedHeight),
    weight: resolvedWeight,
    bmi: patientInfo.bmi || bmiFromQuestion || computedBmi,
    sex: patientInfo.sex || '',
    // Location fields - look in patientResponses root and formObj
    address: patientInfo.address || String(safePatientResponses.address || ''),
    city: patientInfo.city || String(safePatientResponses.city || ''),
    state: patientInfo.state || String(safePatientResponses.state || ''),
    zip: patientInfo.zip || String(safePatientResponses.zip || safePatientResponses.zipCode || ''),
  }

  const medications = safePatientResponses.medications || []
  const company = safePatientResponses.company || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Responses - {patientName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-100px)] px-6 pb-6">
          {/* Checkout page URL - same section style as Patient Information / Questionnaire Items */}
          {checkoutUrl && (
            <>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-lg">Checkout page URL</h3>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">
                    Copy and send this link to the patient if they did not receive the checkout email.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={checkoutUrl}
                      className="font-mono text-sm flex-1 bg-background border-border/50"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={handleCopyCheckoutUrl}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
            </>
          )}

          {/* Company Info */}
          {company && (
            <div className="mt-4 mb-4">
              <Badge variant="outline" className="text-xs">
                {company}
              </Badge>
            </div>
          )}

          {/* Patient Information Section - only show if we have patientInfo data */}
          {Object.keys(extractedPatientInfo).length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-lg">Patient Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                <InfoRow label="Date of Birth" value={extractedPatientInfo.dateOfBirth} />
                <InfoRow label="Sex" value={extractedPatientInfo.sex} />
                <InfoRow label="Height" value={extractedPatientInfo.height} />
                <InfoRow label="Weight" value={extractedPatientInfo.weight} />
                <InfoRow label="BMI" value={extractedPatientInfo.bmi ? String(extractedPatientInfo.bmi) : undefined} />
                {/* Location fields */}
                <InfoRow label="Address" value={extractedPatientInfo.address} className="col-span-2" />
                <InfoRow label="City" value={extractedPatientInfo.city} />
                <InfoRow label="State" value={extractedPatientInfo.state} />
                <InfoRow label="Zip Code" value={extractedPatientInfo.zip} />
              </div>
            </div>
          )}

          {Object.keys(extractedPatientInfo).length > 0 && <Separator className="my-6" />}

          {/* Medications Section (if available) */}
          {medications.length > 0 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-lg">Medications Selected</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {medications.map((med: unknown, idx: number) => {
                    const medication = med && typeof med === "object" ? med as Record<string, unknown> : null
                    const label = typeof med === "string"
                      ? med
                      : String(medication?.name || medication?.medName || JSON.stringify(med))
                    return (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
              <Separator className="my-6" />
            </>
          )}

          {/* Questionnaire Items Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg">Questionnaire Items</h3>
            </div>
            
            {questionsArray.length > 0 ? (
              <div className="space-y-3">
                {questionsArray.map((item, idx) => (
                  <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">
                      {item.question}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No questionnaire items available.
              </p>
            )}
          </div>

          <Separator className="my-6" />

          {/* Uploaded Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-lg">Uploaded Images</h3>
              </div>
              {/* {imageItems.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveImages}
                  disabled={!hasImageChanges || isSavingImages}
                >
                  {isSavingImages ? "Saving..." : "Save"}
                </Button>
              )} */}
            </div>

            {imageItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imageItems.map((item, idx) => {
                  const hasImage = Boolean(item.data)
                  const mime = item.mime || "image/jpeg"
                  const previewSrc = hasImage ? `data:${mime};base64,${item.data}` : ""

                  return (
                    <div key={`${item.question_id || item.question || "image"}-${idx}`} className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3">
                      <p className="text-sm text-muted-foreground font-medium min-h-[40px]">
                        {(item.question || "").trim() || `Uploaded Image ${idx + 1}`}
                      </p>

                      <div className="h-44 bg-background rounded-md border border-border/60 overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <img
                            src={previewSrc}
                            alt={(item.question || "").trim() || `Uploaded image ${idx + 1}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">No image uploaded</p>
                        )}
                      </div>

                      {/* <div className="flex items-center gap-2">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[idx] = el
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            handleFileChange(idx, e.target.files?.[0] || null)
                            e.currentTarget.value = ""
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => fileInputRefs.current[idx]?.click()}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => handleRemoveImage(idx)}
                          disabled={!hasImage}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div> */}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No uploaded images available.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for displaying info rows
function InfoRow({ 
  label, 
  value, 
  className = "" 
}: { 
  label: string
  value?: string | null
  className?: string 
}) {
  if (!value) return null
  
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}
