# AI Research Agent

A full-stack AI project that acts as a B2C AI agent for performing internet research tasks based on user input.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend Logic**: API routes
- **AI**: Anthropic Claude 3.5 Sonnet API (with 30 messages per day limit for demo)
- **Web Search**: Serper.dev

## Features

- User-friendly interface for submitting research queries
- Integration with Claude 3.5 Sonnet for intelligent responses
- Web search capabilities using Serper.dev
- Markdown rendering of AI responses
- Demo mode with 30 message per day limit for cost control

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Copy the environment variables example file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Update `.env.local` with your API keys:
   - Get an Anthropic API key from [https://console.anthropic.com/](https://console.anthropic.com/)
   - Get a Serper API key from [https://serper.dev](https://serper.dev)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app running.

## Message Limits

This application implements a limit of 30 messages per day for the demo version. This limit is reset daily and is tracked on the server side. When the limit is reached, users will receive a 429 error message letting them know they've reached the daily limit.

## Project Structure

```
/
├── /app
│   ├── /api
│   │   └── ask/route.ts       # API route that handles user queries
│   └── page.tsx               # Main UI page
├── /components
│   ├── AgentOutput.tsx        # Renders markdown output
│   └── LoadingSpinner.tsx     # Shows when agent is "thinking"
├── /utils
│   ├── search.ts              # Serper.dev wrapper
│   ├── prompt.ts              # Claude prompt construction
│   └── llm.ts                 # Anthropic Claude interaction with message limiting
```

## Deployment

This project can be easily deployed to Vercel. Simply connect your repository to Vercel and set the environment variables in the Vercel dashboard. 