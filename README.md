# Aginno Open

An intelligent web research assistant. Powered by GPT-4o Mini and Serper.dev.

## Project Overview

This repository contains the MVP implementation of a task-specific agent: a web-based research assistant powered by GPT-4 and real-time search results via Serper.dev.

The current version allows users to type in any research request (e.g., "What are the best dividend-paying stocks under $50?"), and receive a markdown-formatted answer compiled from web search results and summarized by an AI agent using a ReAct-style prompt.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI GPT-4o Mini
- Serper.dev (Google Search API)
- V0.dev for frontend scaffolding

## Getting Started

```bash
git clone https://github.com/ALLENDE123X/AginnoOpen.git
cd AginnoOpen
npm install

# Add your API keys to .env.local
touch .env.local
```

```env
OPENAI_API_KEY=your-openai-key
SERPER_API_KEY=your-serper-key
```

```bash
npm run dev
# Open http://localhost:3000
```

## Current Features

-- Simple text input for user research requests  
-- GPT-4 ReAct-style prompting  
-- Web search results via Serper.dev  
-- Markdown output (bullets, links, reflection)  
-- Clean UI via V0.dev export  
-- Modular file structure for easy expansion
