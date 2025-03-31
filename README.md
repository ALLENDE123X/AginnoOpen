# Aginno Open

A general-purpose AI agent framework, starting with an intelligent web research assistant. Powered by GPT-4o Mini and Serper.dev.

## 🧠 Project Overview

Aginno Open is an open-source initiative to build general-purpose AI agents.

This repository contains the MVP implementation of a task-specific agent: a web-based research assistant powered by GPT-4 and real-time search results via Serper.dev.

The current version allows users to type in any research request (e.g., "What are the best dividend-paying stocks under $50?"), and receive a markdown-formatted answer compiled from web search results and summarized by an AI agent using a ReAct-style prompt.

This is the first step toward a larger vision: building autonomous, modular, and tool-augmented AI agents that can complete a wide range of user-defined tasks.

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI GPT-4o Mini
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
