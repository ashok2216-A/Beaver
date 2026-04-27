import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Book, MessageCircle, FileText, Video } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">
          Get help with Beaver
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>
              Learn how to use Beaver with our comprehensive guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="#" className="inline-flex items-center">
                Read Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Reference
            </CardTitle>
            <CardDescription>
              Technical documentation for the Beaver API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="#" className="inline-flex items-center">
                View API Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutorials
            </CardTitle>
            <CardDescription>
              Watch step-by-step tutorials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="#" className="inline-flex items-center">
                Watch Tutorials
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Get help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="mailto:support@beaver.ai" className="inline-flex items-center">
                Contact Us
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What is Beaver?</h4>
            <p className="text-sm text-muted-foreground">
              Beaver is a platform that turns any OpenAPI specification into an AI-powered assistant. Upload your API docs and start chatting with your API using natural language.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">What formats are supported?</h4>
            <p className="text-sm text-muted-foreground">
              Beaver supports OpenAPI 3.0+ specifications in both JSON and YAML formats.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Is my API data secure?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, all data is encrypted in transit and at rest. API keys are stored securely and never exposed in logs or responses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
