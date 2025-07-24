import 'dotenv/config';
import { ChatLoop } from '../services/chat';
import { ShellToolExecutor } from '../services/tools';
import { ModelProvider } from '../types/config';

// Helper function to check API key and fail test if missing
function requireApiKey(provider: ModelProvider): void {
  const keyMap = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY, 
    gemini: process.env.GEMINI_API_KEY
  };

  const apiKey = keyMap[provider];
  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY is required for integration tests. Please set it in .env file.`);
  }
}

// Test each provider - all support OpenAI-compatible API
const PROVIDERS_TO_TEST: ModelProvider[] = ['openai', 'anthropic', 'gemini'];

describe('Multi-Provider Tool Calling Integration', () => {
  describe.each(PROVIDERS_TO_TEST)('%s provider', (provider) => {
    test('completes full tool calling workflow with real tool execution', async () => {
      requireApiKey(provider);

      const chat = new ChatLoop(provider);
      const toolExecutor = new ShellToolExecutor();
      let toolCalled = false;
      let toolName = '';
      let finalResponse = '';
      let toolCallCount = 0;

      await chat.chat('list the files in this directory', {
        onToolCall: async (toolCall) => {
          toolCalled = true;
          toolName = toolCall.name;
          toolCallCount++;
          console.log(`[${provider}] Tool called: ${toolCall.name} with args:`, toolCall.args);
          
          // Execute the actual tool instead of mocking
          const result = await toolExecutor.execute(toolCall.name, toolCall.args);
          console.log(`[${provider}] Tool execution result:`, result);
          
          if (!result.success) {
            throw new Error(`Tool execution failed: ${result.error}`);
          }
          
          return result.output;
        },
        onComplete: (message) => {
          finalResponse = message;
          console.log(`[${provider}] AI final response:`, message);
        },
        onError: (error) => {
          console.error(`[${provider}] API Error:`, error);
          throw error;
        }
      });

      // Verify tool was called
      expect(toolCalled).toBe(true);
      expect(toolName).toBe('ls');
      expect(toolCallCount).toBe(1);
      
      // Verify we got a final response that incorporates the tool results
      expect(finalResponse).toBeTruthy();
      expect(finalResponse.length).toBeGreaterThan(0);
      
      // The response should mention files or directories (indicating it used the ls results)
      expect(finalResponse.toLowerCase()).toMatch(/file|director|list|content/);
    }, 45000); // 45 second timeout for API calls

    test('handles errors gracefully when tool execution fails', async () => {
      requireApiKey(provider);

      const chat = new ChatLoop(provider);
      let toolCalled = false;
      let errorHandled = false;

      await chat.chat('list files in /nonexistent-directory-12345', {
        onToolCall: async (toolCall) => {
          toolCalled = true;
          console.log(`[${provider}] Tool called: ${toolCall.name} with args:`, toolCall.args);
          
          // This should fail gracefully
          const toolExecutor = new ShellToolExecutor();
          const result = await toolExecutor.execute(toolCall.name, toolCall.args);
          
          if (!result.success) {
            console.log(`[${provider}] Tool execution failed as expected:`, result.error);
            return `Error: ${result.error}`;
          }
          
          return result.output;
        },
        onComplete: (message) => {
          console.log(`[${provider}] AI response after tool error:`, message);
          // AI should handle the error gracefully and provide a meaningful response
          expect(message).toBeTruthy();
        },
        onError: (error) => {
          errorHandled = true;
          console.error(`[${provider}] Unexpected API Error:`, error);
          throw error;
        }
      });

      expect(toolCalled).toBe(true);
      expect(errorHandled).toBe(false); // Should not trigger API errors for tool failures
    }, 45000);

    test('validates complete conversation flow with multiple exchanges', async () => {
      requireApiKey(provider);

      const chat = new ChatLoop(provider);
      const toolExecutor = new ShellToolExecutor();
      const responses: string[] = [];

      // First exchange
      await chat.chat('what files are in the current directory?', {
        onToolCall: async (toolCall) => {
          console.log(`[${provider}] First exchange - Tool called: ${toolCall.name}`);
          const result = await toolExecutor.execute(toolCall.name, toolCall.args);
          return result.success ? result.output : `Error: ${result.error}`;
        },
        onComplete: (message) => {
          console.log(`[${provider}] First exchange response:`, message);
          responses.push(message);
        },
        onError: (error) => {
          throw error;
        }
      });

      // Second exchange - should maintain conversation context
      await chat.chat('how many files are there?', {
        onToolCall: async (toolCall) => {
          console.log(`[${provider}] Second exchange - Tool called: ${toolCall.name}`);
          const result = await toolExecutor.execute(toolCall.name, toolCall.args);
          return result.success ? result.output : `Error: ${result.error}`;
        },
        onComplete: (message) => {
          console.log(`[${provider}] Second exchange response:`, message);
          responses.push(message);
        },
        onError: (error) => {
          throw error;
        }
      });

      expect(responses).toHaveLength(2);
      expect(responses[0]).toBeTruthy();
      expect(responses[1]).toBeTruthy();
      
      // Second response should reference the context or give a count
      expect(responses[1].toLowerCase()).toMatch(/\d+|count|number|many|few|several/);
    }, 60000); // Longer timeout for multiple exchanges
  });
});