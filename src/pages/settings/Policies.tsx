import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"

const policyFormSchema = z.object({
  content: z.string().min(1, "Policy content is required")
})

type PolicyFormData = z.infer<typeof policyFormSchema>

interface PolicySection {
  id: string
  title: string
  lastEdited: string
  author: string
  content: string
}

export default function Policies() {
  const [policies] = useState<PolicySection[]>([
    {
      id: "refund-policy",
      title: "Refund Policy",
      lastEdited: "3 months ago",
      author: "Fahad Rizwan",
      content: ""
    },
    {
      id: "privacy-policy", 
      title: "Privacy Policy",
      lastEdited: "3 months ago",
      author: "Fahad Rizwan",
      content: ""
    },
    {
      id: "terms-of-service",
      title: "Terms of Service", 
      lastEdited: "3 months ago",
      author: "Fahad Rizwan",
      content: ""
    },
    {
      id: "consent-to-telehealth",
      title: "Consent to TeleHealth",
      lastEdited: "3 months ago", 
      author: "Fahad Rizwan",
      content: ""
    },
    {
      id: "physician-code-of-conduct",
      title: "Physician Code of Conduct",
      lastEdited: "3 months ago",
      author: "Fahad Rizwan", 
      content: ""
    },
    {
      id: "shipping-policy",
      title: "Shipping Policy",
      lastEdited: "3 months ago",
      author: "Fahad Rizwan",
      content: ""
    }
  ])

  const PolicyEditor = ({ policy }: { policy: PolicySection }) => {
    const form = useForm<PolicyFormData>({
      resolver: zodResolver(policyFormSchema),
      defaultValues: {
        content: policy.content
      }
    })

    const onSubmit = (data: PolicyFormData) => {
      // TODO: Save policy content
      console.log("Saving policy:", policy.id, data)
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{policy.title}</CardTitle>
              <CardDescription>
                Last edited {policy.lastEdited} by {policy.author}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Create from Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="border border-border rounded-md">
                        {/* Rich text editor toolbar */}
                        <div className="border-b border-border p-2 bg-muted/30">
                          <div className="flex items-center gap-1">
                            <select className="text-sm border-none bg-transparent">
                              <option>Normal</option>
                              <option>Heading 1</option>
                              <option>Heading 2</option>
                            </select>
                            <div className="h-4 w-px bg-border mx-1" />
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              <strong>B</strong>
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              <em>I</em>
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              <u>U</u>
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              S
                            </Button>
                            <div className="h-4 w-px bg-border mx-1" />
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              ≡
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              ≡
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8">
                              ≡
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          {...field}
                          placeholder={`Enter your ${policy.title.toLowerCase()} content here...`}
                          className="min-h-[200px] border-none resize-none focus-visible:ring-0"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Policies</h1>
        <CardDescription className="mt-1">
          Create your own store policies, or customize a template. Saved policies are linked in the footer of your checkout. You can also add policies to your online store menu. Templates aren't legal advice.
        </CardDescription>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Store and Company policies</h2>
      </div>

      {policies.map((policy) => (
        <PolicyEditor key={policy.id} policy={policy} />
      ))}
    </div>
  )
}