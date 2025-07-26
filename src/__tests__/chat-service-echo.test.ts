import { ChatLoop } from '../services/chat';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

describe('Chat Service with Echo API', () => {
  let chatService: ChatLoop;

  beforeAll(() => {
    // Check if ECHO_API_KEY is set
    if (!process.env.ECHO_API_KEY) {
      throw new Error('ECHO_API_KEY environment variable is not set');
    }

    chatService = new ChatLoop(); // No longer needs provider parameter
  });

  test('should successfully chat using echo API', async () => {
    const messages: string[] = [];
    const errors: Error[] = [];

    const callbacks = {
      onComplete: (message: string) => {
        messages.push(message);
        console.log('Received message:', message);
      },
      onError: (error: Error) => {
        errors.push(error);
        console.error('Error:', error);
      }
    };

    try {
      await chatService.chat("Hello! Can you introduce yourself?", callbacks);
      
      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(errors.length).toBe(0);
      expect(messages.length).toBeGreaterThan(0);
      
      console.log('Chat history:', chatService.getHistory());
      
    } catch (error) {
      console.error('Chat test failed:', error);
      throw error;
    }
  }, 30000);

  afterEach(() => {
    chatService.clearHistory();
  });
}); 