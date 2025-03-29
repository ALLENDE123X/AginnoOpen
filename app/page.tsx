"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { AgentOutput } from "@/components/AgentOutput"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function Home() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResult("")

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setResult(data.response);
    } catch (err) {
      console.error("Error fetching research:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleClear = () => {
    setQuery("")
    setResult("")
    setError(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold">Research Agent</h1>
            <p className="text-sm text-muted-foreground mt-1">Your personal AI assistant for deep web research</p>
          </div>
          <div className="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Compare the best productivity tools for students"
              className="flex-1 text-base py-6 px-4"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleClear}
                disabled={isLoading || (!query && !result && !error)}
              >
                Clear
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-medium mb-2">{isLoading ? "Researching your request..." : "Agent's Response"}</h2>

          <Card className={cn("p-6 min-h-[300px] transition-all", isLoading && "bg-muted/50")}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size={8} />
              </div>
            ) : error ? (
              <div className="text-red-500 flex items-center justify-center h-full">
                {error}
              </div>
            ) : (
              <AgentOutput content={result} />
            )}
          </Card>
        </div>
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Research Agent. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

