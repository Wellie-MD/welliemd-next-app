import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"

const metafieldsFormSchema = z.object({
  headCode: z.string().optional()
})

type MetafieldsFormData = z.infer<typeof metafieldsFormSchema>

export default function Metafields() {
  const form = useForm<MetafieldsFormData>({
    resolver: zodResolver(metafieldsFormSchema),
    defaultValues: {
      headCode: ""
    }
  })

  const onSubmit = (data: MetafieldsFormData) => {
    // TODO: Save metafields configuration
    console.log("Saving metafields:", data)
  }

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Metafields</h1>
      </div>

      {/* Development Notice */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Metafields to your pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This feature is still in development and is coming soon.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Head Tag Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Edit &lt;head&gt; tag</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="headCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste the code you would like added to the <head> tag on every page"
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}