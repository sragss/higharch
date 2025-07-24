# Hierch
Hierch is an agentic CLI app which helps sort your folders.

It can be started in any directory, starts by listing, then accepts user prompts and agentically works on them until the folders are properly sorted into a nice hierachy at the users request.

# Implementation details
- We're going to use the OpenAI Typescript SDK to make chat / tool / function calls to the APIs. We'll support OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY.
- We'll use Ink to do pretty rendering of the CLI and the user commands.

# User commaands
*Anything prefixed with "/" runs a special command*
- /model -- prompt to switch model: {OpenAI, Anthropic, Gemini}

# Tools:
exec: 
- Executes mutating shell commands (mv, cp), requires user approval to run

ls:
- Executes a list command, does not require user approval to run, cannot look inside files


