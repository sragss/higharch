// Simplified chat service for now - will implement proper OpenAI Responses API later
import OpenAI from 'openai';
import { ChatService } from '../types/chat';
import { ModelProvider, MODEL_CONFIGS } from '../types/config';

export class SimpleChatService implements ChatService {
  private client: OpenAI;
  private messages: any[] = [];
  private provider: ModelProvider;

  constructor(provider: ModelProvider) {
    this.provider = provider;
    const config = MODEL_CONFIGS[provider];
    
    const apiKeyMap = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY
    };

    const apiKey = apiKeyMap[provider];
    if (!apiKey) {
      throw new Error(`${provider} API key not set`);
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.headers,
      timeout: 120000
    });
  }

  addUserMessage(text: string): void {
    this.messages.push({ role: 'user', content: text });
  }

  async chat(userInput: string): Promise<void> {
    this.addUserMessage(userInput);
    
    // For now, just add a simple response
    // Will implement proper OpenAI API integration later
    this.messages.push({ role: 'assistant', content: `Echo: ${userInput}` });
  }

  getHistory(): any[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [];
  }
}