import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PatientResponses } from "@/api/ordersApi"
import { User, FileText, Pill, AlertCircle, Link2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PatientResponsesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientResponses: PatientResponses | null | undefined
  patientName?: string
  checkoutUrl?: string | null
}

export function PatientResponsesModal({
  open,
  onOpenChange,
  patientResponses,
  patientName = "Patient",
  checkoutUrl
}: PatientResponsesModalProps) {
  const { toast } = useToast()

  const handleCopyCheckoutUrl = () => {
    if (!checkoutUrl) return
    navigator.clipboard.writeText(checkoutUrl)
    toast({
      title: "Copied",
      description: "Checkout URL copied to clipboard.",
    })
  }
  if (!patientResponses) {
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
  const rawFormObj = patientResponses.formObj || patientResponses.questionnaireItems
  const formObj: Record<string, unknown> = (rawFormObj && typeof rawFormObj === 'object' && !Array.isArray(rawFormObj)) 
    ? rawFormObj as Record<string, unknown> 
    : {}
  const patientInfo = patientResponses.patientInfo || {}

  // Convert formObj Q1/A1, Q2/A2 format to array
  const questionsArray: { question: string; answer: string }[] = []
  
  if (formObj && typeof formObj === 'object') {
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

  // Extract patient info from formObj
  // Looking at Beluga payload structure: A1=DOB, A2=height, A3=weight, A4=BMI
  // Location fields might be in different answer keys - check common patterns
  const extractedPatientInfo = {
    dateOfBirth: patientInfo.dateOfBirth || String(formObj.A1 || ''),
    height: formatHeight(patientInfo.height || formObj.A2),
    weight: patientInfo.weight || String(formObj.A3 || ''),
    bmi: patientInfo.bmi || String(formObj.A4 || ''),
    sex: patientInfo.sex || '',
    // Location fields - look in patientResponses root and formObj
    address: patientInfo.address || String(patientResponses.address || ''),
    city: patientInfo.city || String(patientResponses.city || ''),
    state: patientInfo.state || String(patientResponses.state || ''),
    zip: patientInfo.zip || String(patientResponses.zip || patientResponses.zipCode || ''),
  }

  const medications = patientResponses.medications || []
  const company = patientResponses.company || ''

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
                  {medications.map((med: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {typeof med === 'string' ? med : med.name || med.medName || JSON.stringify(med)}
                    </Badge>
                  ))}
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
