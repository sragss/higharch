import { ChatLoop } from '../services/chat';
import { ShellToolExecutor } from '../services/tools';
import { ToolCall } from '../types/chat';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Integration Tests', () => {
  let chatService: ChatLoop;
  let toolExecutor: ShellToolExecutor;

  beforeAll(() => {
    if (!process.env.ECHO_API_KEY) {
      throw new Error('ECHO_API_KEY environment variable is not set');
    }
    
    chatService = new ChatLoop(); // No longer needs provider parameter
    toolExecutor = new ShellToolExecutor();
  });

  afterEach(() => {
    chatService.clearHistory();
  });

  test('should handle basic conversation', async () => {
    const messages: string[] = [];
    const errors: Error[] = [];

    const callbacks = {
      onComplete: (message: string) => {
        messages.push(message);
      },
      onError: (error: Error) => {
        errors.push(error);
      }
    };

    await chatService.chat("Hello!", callbacks);
    
    expect(errors.length).toBe(0);
    expect(messages.length).toBeGreaterThan(0);
  }, 30000);

     test('should handle tool calls', async () => {
     const messages: string[] = [];
     const errors: Error[] = [];

     const callbacks = {
       onToolCall: async (toolCall: ToolCall) => {
        if (toolCall.name === 'ls') {
          const result = await toolExecutor.execute('ls', { command: 'ls -la' });
          return result.output;
        }
        return 'Tool not implemented';
      },
      onComplete: (message: string) => {
        messages.push(message);
      },
      onError: (error: Error) => {
        errors.push(error);
      }
    };

    await chatService.chat("List the current directory contents", callbacks);
    
    expect(errors.length).toBe(0);
    expect(messages.length).toBeGreaterThan(0);
  }, 30000);

     test('should maintain conversation history', async () => {
     const messages: string[] = [];
     const errors: Error[] = [];

     const callbacks = {
       onComplete: (message: string) => {
         messages.push(message);
       },
       onError: (error: Error) => {
         errors.push(error);
       }
     };

     // First message
     await chatService.chat("My name is Alice", callbacks);
     
     // Second message - should reference the first
     await chatService.chat("What's my name?", callbacks);
     
     expect(errors.length).toBe(0);
     expect(messages.length).toBeGreaterThan(1);
     
     // Check that history is maintained
     const history = chatService.getHistory();
     expect(history.length).toBeGreaterThan(1);
   }, 30000);

   test('should handle complex tool interactions', async () => {
     const messages: string[] = [];
     const errors: Error[] = [];

     const callbacks = {
       onToolCall: async (toolCall: ToolCall) => {
        if (toolCall.name === 'ls') {
          const result = await toolExecutor.execute('ls', { command: 'ls -la' });
          return result.output;
        }
        if (toolCall.name === 'exec') {
          // For testing, we'll simulate approval
          const result = await toolExecutor.execute('exec', { command: 'echo "test file" > test.txt' });
          return result.output;
        }
        return 'Tool not implemented';
      },
      onComplete: (message: string) => {
        messages.push(message);
      },
      onError: (error: Error) => {
        errors.push(error);
      }
    };

    await chatService.chat("Create a test file and then list the directory", callbacks);
    
    expect(errors.length).toBe(0);
    expect(messages.length).toBeGreaterThan(0);
  }, 30000);

     test('should handle errors gracefully', async () => {
     const messages: string[] = [];
     const errors: Error[] = [];

     const callbacks = {
       onToolCall: async (toolCall: ToolCall) => {
        // Simulate a tool error
        throw new Error('Tool execution failed');
      },
      onComplete: (message: string) => {
        messages.push(message);
      },
      onError: (error: Error) => {
        errors.push(error);
      }
    };

    try {
      await chatService.chat("Try to list directory", callbacks);
    } catch (error) {
      // Expected to throw due to tool error
    }
    
    expect(errors.length).toBeGreaterThan(0);
  }, 30000);

  test('should handle multiple rapid requests', async () => {
    const messages: string[] = [];
    const errors: Error[] = [];

    const callbacks = {
      onComplete: (message: string) => {
        messages.push(message);
      },
      onError: (error: Error) => {
        errors.push(error);
      }
    };

    // Send multiple requests rapidly
    const promises = [
      chatService.chat("First message", callbacks),
      chatService.chat("Second message", callbacks),
      chatService.chat("Third message", callbacks)
    ];

    await Promise.all(promises);
    
    expect(errors.length).toBe(0);
    expect(messages.length).toBeGreaterThan(0);
  }, 30000);
});