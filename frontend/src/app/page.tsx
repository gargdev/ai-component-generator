import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code, Zap, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bglinear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Component Generator</h1>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
            Turn any website into
            <span className="text-primary"> React components</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste a URL, select sections, and get production-ready React components with Tailwind CSS.
            Powered by AI.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Building <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-lg border bg-card">
              <Code className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Scrape Any Website</h3>
              <p className="text-muted-foreground">
                Extract structure and styles from any public website
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Sparkles className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">
                Convert HTML/CSS to modern React with Tailwind CSS
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Zap className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
              <p className="text-muted-foreground">
                Get clean, typed, and reusable components instantly
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}