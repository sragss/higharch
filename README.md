# Higharch
Higharch is an agentic CLI app which helps sort your folders.

It can be started in any directory, starts by listing, then accepts user prompts and agentically works on them until the folders are properly sorted into a nice hierarchy at the user's request.

# Implementation details
- Uses the OpenAI TypeScript SDK with the Responses API (`/v1/responses`) for native tool calling
- Only supports OpenAI due to Responses API requirements
- Uses Echo API (`https://echo.router.merit.systems`) for enhanced performance
- Uses Ink for pretty rendering of the CLI and user commands

# Setup

## Option 1: Global Installation (Recommended)
1. Set your `ECHO_API_KEY` environment variable
2. Run `npm run install:global` to install globally
3. Run `higharch` from any directory to start the application

## Option 2: Local Development
1. Set your `ECHO_API_KEY` environment variable
2. Run `npm install` to install dependencies
3. Run `npm start` to start the application

## Uninstalling
To uninstall the global version: `npm run uninstall:global`

# Tools
- **exec**: Executes mutating shell commands (mv, cp, etc.), requires user approval to run
- **ls**: Executes list commands, does not require user approval, cannot look inside files

# Usage
```bash
# Navigate to any directory you want to organize
cd ~/Downloads

# Start higharch
higharch

# Or if installed locally
npm start
```

# Features
- ✅ Native tool calling with OpenAI Responses API
- ✅ Conversation history and context maintenance
- ✅ User approval for potentially destructive commands
- ✅ Real-time directory listing updates
- ✅ Clean, interactive CLI interface


