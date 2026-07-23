import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface ChunkErrorBoundaryProps {
  children: React.ReactNode
}

interface ChunkErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

const CHUNK_LOAD_PATTERNS = [
  "Loading chunk",
  "dynamically imported",
  "import failed",
  "Failed to fetch",
  "ChunkLoadError",
  "Loading CSS chunk",
]

function isChunkError(error: Error): boolean {
  return CHUNK_LOAD_PATTERNS.some((pattern) =>
    error.message?.includes(pattern) ||
    error.name?.includes(pattern)
  )
}

export default class ChunkErrorBoundary extends React.Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context = isChunkError(error) ? "chunk-load" : "render"
    console.error(`[ChunkErrorBoundary] ${context} error:`, error, errorInfo)
  }

  handleRetry = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const error = this.state.error
    const isChunk = error ? isChunkError(error) : false

    return (
      <div className="flex items-center justify-center p-12">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {isChunk ? "Failed to load page" : "Something went wrong"}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              {isChunk
                ? "The application could not load a required module. This can happen after a deploy or due to a network interruption."
                : "An unexpected error occurred while rendering this page."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
