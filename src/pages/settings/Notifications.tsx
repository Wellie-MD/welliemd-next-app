import { useEffect, useRef, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchNotificationPreferences, saveNotificationPreferences } from "@/api/notificationPreferencesApi"

interface NotificationPreferences {
  [key: string]: {
    email: boolean
    sms: boolean
    slack?: boolean
  }
}

export default function Notifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // Patient Notifications - Orders
    firstTimeOrderConfirmation: { email: true, sms: true },
    orderConfirmation: { email: true, sms: true },
    receipt: { email: true, sms: true },
    orderEdited: { email: true, sms: true },
    orderCanceled: { email: true, sms: true },
    abandonedCheckout: { email: true, sms: true },
    abandonedPostCheckout: { email: true, sms: true },
    paymentError: { email: true, sms: true },
    labReceived: { email: true, sms: true },
    labResulted: { email: true, sms: true },
    labRejected: { email: true, sms: true },
    treatmentActive: { email: true, sms: true },
    
    // Shipping
    firstTimeShippingConfirmation: { email: true, sms: true },
    shippingConfirmation: { email: true, sms: true },
    shippingUpdate: { email: true, sms: true },
    deliveryTomorrow: { email: true, sms: true },
    outForDelivery: { email: true, sms: true },
    delivered: { email: true, sms: true },
    
    // Patient
    welcome: { email: true, sms: true },
    otp: { email: true, sms: true },
    passwordReset: { email: true, sms: true },
    informationChanged: { email: true, sms: true },
    prescriptionChanged: { email: true, sms: true },
    whatToExpectNext: { email: true, sms: true },
    doctorMessage: { email: true, sms: true },
    supportMessage: { email: true, sms: true },
    firstTimeNewPrescription: { email: true, sms: true },
    newPrescription: { email: true, sms: true },
    newRefill: { email: true, sms: true },
    fourMonthCheckIn: { email: true, sms: true },
    subscriptionRenewal: { email: true, sms: true },
    paymentMethodUpdated: { email: true, sms: true },
    doctorReviewedPatient: { email: true, sms: true },
    magicLink: { email: true, sms: true },
    followUpDue: { email: true, sms: true },
    followUpPastDue: { email: true, sms: true },
    followUpDueInTwoDays: { email: true, sms: true },
    checkinRenewal: { email: true, sms: true },
    visitScheduled: { email: true, sms: true },
    visitUpcoming: { email: true, sms: true },
    visitComplete: { email: true, sms: true },
    threeMonthCheckIn: { email: true, sms: true },
    billingPlanChange: { email: true, sms: true },
    treatmentChange: { email: true, sms: true },
    
    // Admin Notifications
    newOrder: { email: true, sms: true, slack: true },
    newPrescriptionAdmin: { email: true, sms: true, slack: true },
    newPatient: { email: true, sms: true, slack: true },
    error: { email: true, sms: true, slack: true },
    refillDue: { email: true, sms: true, slack: true },
    trialExpired: { email: false, sms: false, slack: false },
    paymentPastDue: { email: true, sms: true, slack: true },
    paymentFailed: { email: true, sms: true, slack: true },
    patientMessage: { email: true, sms: true, slack: true },
    supportMessageAdmin: { email: true, sms: true, slack: true },
    refund: { email: true, sms: true, slack: true },
    dispute: { email: true, sms: true, slack: true },
    disputeDueSoon: { email: true, sms: true, slack: true },
    pharmacyDelay: { email: true, sms: true, slack: true },
    pharmacyError: { email: true, sms: true, slack: true },
    pharmacyUpdate: { email: true, sms: true, slack: true },
    doctorsSupportMessage: { email: true, sms: true, slack: true },
    dailyReport: { email: false, sms: false, slack: false },
    patientPaymentFailed: { email: true, sms: true, slack: true },
    webhookDisabled: { email: true, sms: true, slack: true },
    pharmacyOrderFlag: { email: false, sms: false, slack: false },
    pharmacyOrderNotes: { email: false, sms: false, slack: false }
  })
  const syncTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const persisted = await fetchNotificationPreferences()
        if (!mounted || !persisted || Object.keys(persisted).length === 0) return
        setPreferences((prev) => ({ ...prev, ...persisted }))
      } catch {
        // Keep local defaults if API fetch fails.
      }
    })()
    return () => {
      mounted = false
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  const scheduleSave = (next: NotificationPreferences) => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
    syncTimerRef.current = window.setTimeout(async () => {
      try {
        await saveNotificationPreferences(next)
      } catch {
        // Keep UI responsive even if save fails.
      }
    }, 400)
  }

  const togglePreference = (key: string, type: 'email' | 'sms' | 'slack') => {
    setPreferences(prev => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          [type]: !prev[key][type]
        }
      }
      scheduleSave(next)
      return next
    })
  }

  const toggleAllInSection = (keys: string[], type: 'email' | 'sms' | 'slack', value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev }
      keys.forEach(key => {
        if (updated[key] && typeof updated[key][type] !== 'undefined') {
          updated[key][type] = value
        }
      })
      scheduleSave(updated)
      return updated
    })
  }

  const NotificationRow = ({ 
    id, 
    title, 
    description, 
    hasSlack = false 
  }: { 
    id: string
    title: string
    description: string
    hasSlack?: boolean 
  }) => (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border last:border-b-0">
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Switch 
            checked={preferences[id]?.email || false}
            onCheckedChange={() => togglePreference(id, 'email')}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={preferences[id]?.sms || false}
            onCheckedChange={() => togglePreference(id, 'sms')}
          />
        </div>
        {hasSlack && (
          <div className="flex items-center gap-2">
            <Switch 
              checked={preferences[id]?.slack || false}
              onCheckedChange={() => togglePreference(id, 'slack')}
            />
          </div>
        )}
      </div>
    </div>
  )

  const SectionHeader = ({ 
    title, 
    keys, 
    hasSlack = false 
  }: { 
    title: string
    keys: string[]
    hasSlack?: boolean 
  }) => (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-foreground">EMAIL</span>
          <Switch 
            checked={keys.every(key => preferences[key]?.email)}
            onCheckedChange={(checked) => toggleAllInSection(keys, 'email', checked)}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-foreground">SMS</span>
          <Switch 
            checked={keys.every(key => preferences[key]?.sms)}
            onCheckedChange={(checked) => toggleAllInSection(keys, 'sms', checked)}
          />
        </div>
        {hasSlack && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-foreground">SLACK</span>
            <Switch 
              checked={keys.every(key => preferences[key]?.slack)}
              onCheckedChange={(checked) => toggleAllInSection(keys, 'slack', checked)}
            />
          </div>
        )}
      </div>
    </div>
  )

  const patientNotificationOrderKeys = [
    'firstTimeOrderConfirmation', 'orderConfirmation', 'receipt', 'orderEdited', 
    'orderCanceled', 'abandonedCheckout', 'abandonedPostCheckout', 'paymentError',
    'labReceived', 'labResulted', 'labRejected', 'treatmentActive'
  ]

  const shippingKeys = [
    'firstTimeShippingConfirmation', 'shippingConfirmation', 'shippingUpdate',
    'deliveryTomorrow', 'outForDelivery', 'delivered'
  ]

  const patientKeys = [
    'welcome', 'otp', 'passwordReset', 'informationChanged', 'prescriptionChanged',
    'whatToExpectNext', 'doctorMessage', 'supportMessage', 'firstTimeNewPrescription',
    'newPrescription', 'newRefill', 'fourMonthCheckIn', 'subscriptionRenewal',
    'paymentMethodUpdated', 'doctorReviewedPatient', 'magicLink', 'followUpDue',
    'followUpPastDue', 'followUpDueInTwoDays', 'checkinRenewal', 'visitScheduled',
    'visitUpcoming', 'visitComplete', 'threeMonthCheckIn', 'billingPlanChange', 'treatmentChange'
  ]

  const adminKeys = [
    'newOrder', 'newPrescriptionAdmin', 'newPatient', 'error', 'refillDue',
    'trialExpired', 'paymentPastDue', 'paymentFailed', 'patientMessage',
    'supportMessageAdmin', 'refund', 'dispute', 'disputeDueSoon', 'pharmacyDelay',
    'pharmacyError', 'pharmacyUpdate', 'doctorsSupportMessage', 'dailyReport',
    'patientPaymentFailed', 'webhookDisabled', 'pharmacyOrderFlag', 'pharmacyOrderNotes'
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
       <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Patient Notifications</span>
          </CardTitle>
        </CardHeader> 
      </div>
    
      <Card>
        
        <CardContent className="p-0">
          {/* Orders Section */}
          <SectionHeader title="Orders" keys={patientNotificationOrderKeys} />
          
          <NotificationRow
            id="firstTimeOrderConfirmation"
            title="First time order confirmation"
            description="Send automatically to the customer after they place their first order."
          />
          <NotificationRow
            id="orderConfirmation"
            title="Order confirmation"
            description="Send automatically to the customer after they place their order."
          />
          <NotificationRow
            id="receipt"
            title="Receipt"
            description="Send automatically once Stripe successfully charges the credit card on file and begins the subscription."
          />
          <NotificationRow
            id="orderEdited"
            title="Order edited"
            description="Send automatically to the customer after their order is edited or any changes are made to an order."
          />
          <NotificationRow
            id="orderCanceled"
            title="Order canceled"
            description="Send automatically to the customer if their order is canceled for any reason."
          />
          <NotificationRow
            id="abandonedCheckout"
            title="Abandoned checkout"
            description="Send to the customer if they leave the questionnaire / checkout before submitting the order."
          />
          <NotificationRow
            id="abandonedPostCheckout"
            title="Abandoned post-checkout"
            description="Send to the customer if they leave the questionnaire after checkout but before completing it."
          />
          <NotificationRow
            id="paymentError"
            title="Payment error"
            description="Send automatically to the customer if their payment can't be processed."
          />
          <NotificationRow
            id="labReceived"
            title="Lab Received"
            description="Send to the customer when their lab test sample is received by the lab."
          />
          <NotificationRow
            id="labResulted"
            title="Lab Resulted"
            description="Send to the customer when their lab test results are available."
          />
          <NotificationRow
            id="labRejected"
            title="Lab Rejected"
            description="Send to the customer when their lab test sample was rejected."
          />
          <NotificationRow
            id="treatmentActive"
            title="Treatment Active"
            description="Send to the patient when their treatment becomes active with auto-refills."
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0">
          <SectionHeader title="Shipping" keys={shippingKeys} />
          
          <NotificationRow
            id="firstTimeShippingConfirmation"
            title="First time shipping confirmation"
            description="Send to the customer when their first order is shipped."
          />
          <NotificationRow
            id="shippingConfirmation"
            title="Shipping confirmation"
            description="Send automatically to the customer when their order is shipped."
          />
          <NotificationRow
            id="shippingUpdate"
            title="Shipping update"
            description="Send automatically to the customer if their fulfilled order's tracking number has new events."
          />
          <NotificationRow
            id="deliveryTomorrow"
            title="Delivery tomorrow"
            description="Send to the customer automatically when orders tracking information marks the delivery date 24 hours from the current date."
          />
          <NotificationRow
            id="outForDelivery"
            title="Out for delivery"
            description="Send to the customer automatically after orders with tracking information are out for delivery."
          />
          <NotificationRow
            id="delivered"
            title="Delivered"
            description="Send to the customer automatically after orders with tracking information are delivered."
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0">
          <SectionHeader title="Patient" keys={patientKeys} />
          
          <NotificationRow
            id="welcome"
            title="Welcome"
            description="Send automatically to the customer upon account activation."
          />
          <NotificationRow
            id="otp"
            title="OTP"
            description="Send automatically to the customer when they request a one-time password."
          />
          <NotificationRow
            id="passwordReset"
            title="Password reset"
            description="Send automatically to the customer when they ask to reset their account's password."
          />
          <NotificationRow
            id="informationChanged"
            title="Information changed"
            description="Send automatically when a patient changes or updates information in their account successfully. (Email, address, password, etc.)"
          />
          <NotificationRow
            id="prescriptionChanged"
            title="Prescription changed"
            description="Send automatically when the patient requests to delay or pause automatic refills."
          />
          <NotificationRow
            id="whatToExpectNext"
            title="What to expect next"
            description="Send automatically two weeks after a customer's first order was delivered."
          />
          <NotificationRow
            id="doctorMessage"
            title="Doctor message"
            description="Send automatically to the patient every time a doctor sends the patient a message."
          />
          <NotificationRow
            id="supportMessage"
            title="Support message"
            description="Send automatically to the patient every time a member of support sends the patient a message."
          />
          <NotificationRow
            id="firstTimeNewPrescription"
            title="First time new prescription"
            description="Send automatically to the Customer after their first prescription is successfully written and sent to the pharmacy."
          />
          <NotificationRow
            id="newPrescription"
            title="New prescription"
            description="Send automatically to the customer after a new prescription is successfully written and sent to the pharmacy."
          />
          <NotificationRow
            id="newRefill"
            title="New refill"
            description="Send automatically to the customer 2 days before a new order (for a refill) is sent to the pharmacy for fulfillment."
          />
          <NotificationRow
            id="fourMonthCheckIn"
            title="Four month check-in"
            description="Send automatically to the customer 4 months after their prescription was written for an optional check-in with their doctor."
          />
          <NotificationRow
            id="subscriptionRenewal"
            title="Subscription renewal"
            description="Send automatically to the customer after the initial 12 month subscription has expired and a new prescription is needed for renewal."
          />
          <NotificationRow
            id="paymentMethodUpdated"
            title="Payment method updated"
            description="Send to the customer when they update their stored payment method or if the current payment method is no longer valid/working."
          />
          <NotificationRow
            id="doctorReviewedPatient"
            title="Doctor reviewed the patient"
            description="Send automatically to the patient when the doctor reviewed the patient's questionnaire."
          />
          <NotificationRow
            id="magicLink"
            title="Magic link"
            description="Send to the patient when they request a magic link to sign in."
          />
          <NotificationRow
            id="followUpDue"
            title="Follow up due"
            description="Send automatically to the patient when a follow up visit is due."
          />
          <NotificationRow
            id="followUpPastDue"
            title="Follow up past due"
            description="Send automatically to the patient when a follow up visit is two days past due."
          />
          <NotificationRow
            id="followUpDueInTwoDays"
            title="Follow up due in two days"
            description="Send automatically to the patient when a follow up visit is due in two days."
          />
          <NotificationRow
            id="checkinRenewal"
            title="Checkin Renewal"
            description="Send automatically to the customer when a check-in renewal is due."
          />
          <NotificationRow
            id="visitScheduled"
            title="Visit Scheduled"
            description="Send automatically to the customer when a sync visit is scheduled."
          />
          <NotificationRow
            id="visitUpcoming"
            title="Visit Upcoming"
            description="Send automatically to the customer when a sync visit is upcoming."
          />
          <NotificationRow
            id="visitComplete"
            title="Visit Complete"
            description="Send automatically to the customer when a sync visit is completed."
          />
          <NotificationRow
            id="threeMonthCheckIn"
            title="Three month check-in"
            description="Send automatically to the customer for the three month check-in with the doctor."
          />
          <NotificationRow
            id="billingPlanChange"
            title="Billing Plan Change"
            description="Send automatically to the customer when their billing plan price or schedule changes."
          />
          <NotificationRow
            id="treatmentChange"
            title="Treatment Change"
            description="Send automatically to the customer when treatment delivery date, dose, quantity or strength changes."
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Admin Notifications</span>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect width="4" height="12" x="2" y="9"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              Add to Slack
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SectionHeader title="All" keys={adminKeys} hasSlack />
          
          <NotificationRow
            id="newOrder"
            title="New order"
            description="Send to order notification subscribers when a customer places an order."
            hasSlack
          />
          <NotificationRow
            id="newPrescriptionAdmin"
            title="New prescription"
            description="Send to new prescription subscribers when a patient receives a new prescription."
            hasSlack
          />
          <NotificationRow
            id="newPatient"
            title="New patient"
            description="Send to new patient subscribers when you receive a new patient."
            hasSlack
          />
          <NotificationRow
            id="error"
            title="Error"
            description="Send to error notification subscribers when a system error or any other error occurs."
            hasSlack
          />
          <NotificationRow
            id="refillDue"
            title="Refill due"
            description="Send automatically 24 hours before a patient's refill date to remind admin to submit the refill for fulfillment to the pharmacy."
            hasSlack
          />
          <NotificationRow
            id="trialExpired"
            title="Trial expired"
            description="Send when your trial period has expired."
            hasSlack
          />
          <NotificationRow
            id="paymentPastDue"
            title="Payment past due"
            description="Send when your payment is past due and your account is in danger of being suspended."
            hasSlack
          />
          <NotificationRow
            id="paymentFailed"
            title="Payment failed"
            description="Send when your payment fails and your account is in danger of being suspended."
            hasSlack
          />
          <NotificationRow
            id="patientMessage"
            title="Patient message"
            description="Send when a patient sends you a message through the patient portal."
            hasSlack
          />
          <NotificationRow
            id="supportMessageAdmin"
            title="Support message"
            description="Send when we send you a support message."
            hasSlack
          />
          <NotificationRow
            id="refund"
            title="Refund"
            description="Send when a refund is issued to a patient."
            hasSlack
          />
          <NotificationRow
            id="dispute"
            title="Dispute"
            description="Send when a dispute is issued to a patient."
            hasSlack
          />
          <NotificationRow
            id="disputeDueSoon"
            title="Dispute Due Soon"
            description="Send when a dispute is due soon."
            hasSlack
          />
          <NotificationRow
            id="pharmacyDelay"
            title="Pharmacy delay"
            description="Send when a pharmacy delay is issued to a patient."
            hasSlack
          />
          <NotificationRow
            id="pharmacyError"
            title="Pharmacy error"
            description="Send when a pharmacy error is issued to a patient."
            hasSlack
          />
          <NotificationRow
            id="pharmacyUpdate"
            title="Pharmacy Update"
            description="Send when an order is updated by the pharmacy."
            hasSlack
          />
          <NotificationRow
            id="doctorsSupportMessage"
            title="Doctors support message"
            description="Send when doctors send you a support message."
            hasSlack
          />
          <NotificationRow
            id="dailyReport"
            title="Daily report"
            description="Send at the end of the day to report on the days activity and orders."
            hasSlack
          />
          <NotificationRow
            id="patientPaymentFailed"
            title="Patient payment failed"
            description="Send when a patient's payment fails."
            hasSlack
          />
          <NotificationRow
            id="webhookDisabled"
            title="Webhook disabled"
            description="Send when an webhook is automatically disabled due to a high failure rate."
            hasSlack
          />
          <NotificationRow
            id="pharmacyOrderFlag"
            title="Pharmacy Order Flag"
            description="Send automatically to the subscribers when their order is flagged by the pharmacy."
            hasSlack
          />
          <NotificationRow
            id="pharmacyOrderNotes"
            title="Pharmacy Order Notes"
            description="Send automatically to the admin when a note is added to an order by the pharmacy/subscriber."
            hasSlack
          />
        </CardContent>
      </Card>
    </div>
  )
}
