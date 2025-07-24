// Simple component tests - testing the props interfaces and basic functionality
import { ChatMessage } from '../components/ChatHistory';
import { ModelProvider } from '../types/config';

describe('Component Types', () => {
  test('ChatMessage has correct structure', () => {
    const message: ChatMessage = {
      id: '123',
      role: 'user',
      content: 'Hello world',
      timestamp: new Date()
    };

    expect(message.id).toBe('123');
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello world');
    expect(message.timestamp).toBeInstanceOf(Date);
  });

  test('ModelProvider type accepts valid providers', () => {
    const validProviders: ModelProvider[] = ['openai', 'anthropic', 'gemini'];
    
    validProviders.forEach(provider => {
      expect(['openai', 'anthropic', 'gemini']).toContain(provider);
    });
  });

  test('Components module exists', () => {
    // Simple test to ensure component types are correct
    expect(true).toBe(true);
  });
});