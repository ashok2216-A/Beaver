'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileCode, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewAgentPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [specContent, setSpecContent] = useState("")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onload = (event) => {
        setSpecContent(event.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Agent</h1>
          <p className="text-muted-foreground">
            Upload an OpenAPI specification to create an AI agent
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
          <CardDescription>
            Give your agent a name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input id="name" placeholder="e.g., Stripe Assistant" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe what this agent does..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAPI Specification</CardTitle>
          <CardDescription>
            Upload your API specification in JSON or YAML format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
              id="spec-upload"
            />
            <label htmlFor="spec-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {specContent ? "File uploaded" : "Click to upload"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop your OpenAPI spec
                  </p>
                </div>
              </div>
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or paste directly</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spec">OpenAPI Specification</Label>
            <Textarea 
              id="spec" 
              placeholder='{"openapi": "3.0.0", ...}'
              rows={10}
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Configure how your agent authenticates with the API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (optional)</Label>
            <Input 
              id="api-key" 
              type="password"
              placeholder="sk-..." 
            />
            <p className="text-xs text-muted-foreground">
              This will be used to authenticate API calls made by your agent
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/agents">Cancel</Link>
        </Button>
        <Button disabled={!specContent}>
          <FileCode className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>
    </div>
  )
}
