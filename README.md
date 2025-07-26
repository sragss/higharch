# Higharch
Higharch is an agentic CLI app which helps sort your folders.

It can be started in any directory, starts by listing, then accepts user prompts and agentically works on them until the folders are properly sorted into a nice hierachy at the users request.

# Implementation details
- We're going to use the OpenAI Typescript SDK to make chat / tool / function calls to the APIs. We'll support OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY.
- We'll use Ink to do pretty rendering of the CLI and the user commands.

## Multi-Provider Tool Calling Status

**Current Implementation:**
- ✅ **OpenAI**: Full support using OpenAI Responses API (`/v1/responses`) with native tool calling
- ❌ **Anthropic**: Limited - OpenAI SDK compatibility layer only supports `/v1/messages` (chat completions), not `/v1/responses`
- ❌ **Gemini**: Limited - OpenAI SDK compatibility layer only supports chat completions, not `/v1/responses`

**Provider Compatibility Research:**

**Anthropic OpenAI SDK Compatibility:**
- ✅ Supports tool calling via `/v1/messages` endpoint  
- ⚠️ `strict` parameter ignored (tool JSON not guaranteed to follow schema)
- ⚠️ Intended for testing/comparison, not production use
- ❌ No support for OpenAI Responses API endpoint

**Gemini OpenAI SDK Compatibility:**
- ✅ Supports tool calling via chat completions (`/v1/chat/completions`)
- ⚠️ Still in beta, some limitations with multiple functions
- ⚠️ Some schema types not supported (like `anyOf`)
- ❌ No support for OpenAI Responses API endpoint

**Options for Multi-Provider Support:**

1. **Hybrid Approach**: Keep Responses API for OpenAI, implement chat completions for Anthropic/Gemini
2. **Unified Approach**: Switch everything to chat completions API for consistency across providers  
3. **Proxy Service**: Use LiteLLM or similar service to provide unified interface

**Current Status**: Only OpenAI provider fully functional with tool calling. Architecture ready for multi-provider expansion once approach is chosen.

# User commaands
*Anything prefixed with "/" runs a special command*
- /model -- prompt to switch model: {OpenAI, Anthropic, Gemini}

# Tools:
exec: 
- Executes mutating shell commands (mv, cp), requires user approval to run

ls:
- Executes a list command, does not require user approval to run, cannot look inside files


