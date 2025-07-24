import 'dotenv/config';
import { ChatLoop } from '../services/chat';
import { ShellToolExecutor } from '../services/tools';
import { ToolApprovalRequest } from '../types/tools';

// Helper function to check OpenAI API key and fail test if missing
function requireOpenAIApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for integration tests. Please set it in .env file.');
  }
}

describe('OpenAI Tool Calling Integration', () => {
  test('completes full tool calling workflow with real tool execution', async () => {
    requireOpenAIApiKey();

    const chat = new ChatLoop('openai');
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
        console.log(`Tool called: ${toolCall.name} with args:`, toolCall.args);
        
        // Execute the actual tool instead of mocking
        const result = await toolExecutor.execute(toolCall.name, toolCall.args);
        console.log('Tool execution result:', result);
        
        if (!result.success) {
          throw new Error(`Tool execution failed: ${result.error}`);
        }
        
        return result.output;
      },
      onComplete: (message) => {
        finalResponse = message;
        console.log('AI final response:', message);
      },
      onError: (error) => {
        console.error('API Error:', error);
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
    requireOpenAIApiKey();

    const chat = new ChatLoop('openai');
    let toolCalled = false;
    let errorHandled = false;

    await chat.chat('list files in /nonexistent-directory-12345', {
      onToolCall: async (toolCall) => {
        toolCalled = true;
        console.log(`Tool called: ${toolCall.name} with args:`, toolCall.args);
        
        // This should fail gracefully
        const toolExecutor = new ShellToolExecutor();
        const result = await toolExecutor.execute(toolCall.name, toolCall.args);
        
        if (!result.success) {
          console.log('Tool execution failed as expected:', result.error);
          return `Error: ${result.error}`;
        }
        
        return result.output;
      },
      onComplete: (message) => {
        console.log('AI response after tool error:', message);
        // AI should handle the error gracefully and provide a meaningful response
        expect(message).toBeTruthy();
      },
      onError: (error) => {
        errorHandled = true;
        console.error('Unexpected API Error:', error);
        throw error;
      }
    });

    expect(toolCalled).toBe(true);
    expect(errorHandled).toBe(false); // Should not trigger API errors for tool failures
  }, 45000);

  test('exec tool requires approval and handles approval correctly', async () => {
    requireOpenAIApiKey();

    const chat = new ChatLoop('openai');
    const toolExecutor = new ShellToolExecutor();
    let toolCalled = false;
    let toolName = '';
    let approvalRequested = false;
    let finalResponse = '';

    await chat.chat('create a test file called hello.txt with the content "test"', {
      onToolCall: async (toolCall) => {
        toolCalled = true;
        toolName = toolCall.name;
        console.log(`Tool called: ${toolCall.name} with args:`, toolCall.args);
        
        // Mock approval function that always approves for testing
        const mockApproval = async (req: ToolApprovalRequest) => {
          approvalRequested = true;
          console.log('Approval requested for:', req.command);
          return true; // Always approve for test
        };
        
        const result = await toolExecutor.execute(
          toolCall.name, 
          toolCall.args,
          toolCall.name === 'exec' ? mockApproval : undefined
        );
        
        console.log('Tool execution result:', result);
        
        if (!result.success) {
          return `Error: ${result.error}`;
        }
        
        return result.output;
      },
      onComplete: (message) => {
        finalResponse = message;
        console.log('AI final response:', message);
      },
      onError: (error) => {
        console.error('API Error:', error);
        throw error;
      }
    });

    // Verify exec tool was called and approval was requested
    expect(toolCalled).toBe(true);
    expect(toolName).toBe('exec');
    expect(approvalRequested).toBe(true);
    expect(finalResponse).toBeTruthy();
    
    // Clean up the test file if it was created
    try {
      const fs = require('fs');
      if (fs.existsSync('hello.txt')) {
        fs.unlinkSync('hello.txt');
        console.log('Cleaned up test file: hello.txt');
      }
    } catch (err) {
      console.log('No cleanup needed or cleanup failed:', err);
    }
  }, 45000);

  test('exec tool handles approval denial correctly', async () => {
    requireOpenAIApiKey();

    const chat = new ChatLoop('openai');
    const toolExecutor = new ShellToolExecutor();
    let toolCalled = false;
    let approvalRequested = false;
    let finalResponse = '';

    await chat.chat('create a directory called test-dir-to-deny', {
      onToolCall: async (toolCall) => {
        toolCalled = true;
        console.log(`Tool called: ${toolCall.name} with args:`, toolCall.args);
        
        // Mock approval function that always denies for testing
        const mockApproval = async (req: ToolApprovalRequest) => {
          approvalRequested = true;
          console.log('Approval requested for command:', req.command);
          return false; // Always deny for test
        };
        
        const result = await toolExecutor.execute(
          toolCall.name, 
          toolCall.args,
          toolCall.name === 'exec' ? mockApproval : undefined
        );
        
        console.log('Tool execution result after denial:', result);
        return result.success ? result.output : `Error: ${result.error}`;
      },
      onComplete: (message) => {
        finalResponse = message;
        console.log('AI response after command denial:', message);
      },
      onError: (error) => {
        console.error('API Error:', error);
        throw error;
      }
    });

    // Verify exec tool was called, approval was requested, and command was denied
    expect(toolCalled).toBe(true);
    expect(approvalRequested).toBe(true);
    expect(finalResponse).toBeTruthy();
    
    // The response should indicate that the command was not executed
    expect(finalResponse.toLowerCase()).toMatch(/not|denied|cancelled|refused|cannot|error|permission/);
  }, 45000);

  test('validates complete conversation flow with multiple exchanges', async () => {
    requireOpenAIApiKey();

    const chat = new ChatLoop('openai');
    const toolExecutor = new ShellToolExecutor();
    const responses: string[] = [];

    // First exchange
    await chat.chat('what files are in the current directory?', {
      onToolCall: async (toolCall) => {
        console.log('First exchange - Tool called:', toolCall.name);
        const result = await toolExecutor.execute(toolCall.name, toolCall.args);
        return result.success ? result.output : `Error: ${result.error}`;
      },
      onComplete: (message) => {
        console.log('First exchange response:', message);
        responses.push(message);
      },
      onError: (error) => {
        throw error;
      }
    });

    // Second exchange - should maintain conversation context
    await chat.chat('how many files are there?', {
      onToolCall: async (toolCall) => {
        console.log('Second exchange - Tool called:', toolCall.name);
        const result = await toolExecutor.execute(toolCall.name, toolCall.args);
        return result.success ? result.output : `Error: ${result.error}`;
      },
      onComplete: (message) => {
        console.log('Second exchange response:', message);
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