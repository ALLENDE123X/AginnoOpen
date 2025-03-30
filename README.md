# Aginno Open

A general-purpose AI agent framework, starting with an intelligent web research assistant. Powered by GPT-4 and Serper.dev.

## 🧠 Project Overview

Aginno Open is an open-source initiative to build general-purpose AI agents.

This repository contains the MVP implementation of a task-specific agent: a web-based research assistant powered by GPT-4 and real-time search results via Serper.dev.

The current version allows users to type in any research request (e.g., "What are the best dividend-paying stocks under $50?"), and receive a markdown-formatted answer compiled from web search results and summarized by an AI agent using a ReAct-style prompt.

This is the first step toward a larger vision: building autonomous, modular, and tool-augmented AI agents that can complete a wide range of user-defined tasks.

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI GPT-4 Turbo
- Serper.dev (Google Search API)
- V0.dev for frontend scaffolding
- Cursor.sh for backend agent development

## 🚀 Getting Started

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

## 🧪 Current Features

✅ Simple text input for user research requests
✅ GPT-4 ReAct-style prompting
✅ Web search results via Serper.dev
✅ Markdown output (bullets, links, reflection)
✅ Clean UI via V0.dev export
✅ Modular file structure for easy expansion

## 🧭 Project Roadmap

☑️ MVP: Research agent (done)
🔄 Tool expansion (e.g., calculators, summarizers, file readers)
🔄 Add planning memory + reflection loop
🔄 Multi-turn tasks with goals/subgoals
🔄 Model switching based on task type
🔄 Agent "personality" profiles and skill templates
🔄 User accounts and agent history
🔄 Agent marketplace and sharing

## 🤝 Contributing

We welcome community contributions as we expand beyond the MVP.

Feel free to submit PRs, bug reports, or ideas in the issues tab. We aim to make this the go-to open agentic framework for developers building helpful assistants.

## Deployment Guide

### Vercel Deployment

1. Fork this repository on GitHub
2. Connect Vercel to your GitHub account
3. Create a new project on Vercel linked to your forked repository
4. Add the following environment variables in Vercel project settings:
   - `OPENAI_API_KEY` - Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - `SERPER_API_KEY` - Your Serper.dev API key from [Serper.dev](https://serper.dev/)
   - `ANTHROPIC_API_KEY` - Your Anthropic API key from [Anthropic Console](https://console.anthropic.com/)
5. Deploy the project

### Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env.local` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   SERPER_API_KEY=your_serper_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Dependencies

This project uses:
- Next.js 15
- React 19
- Tailwind CSS
- OpenAI API
- Anthropic API
- Serper API for web search 