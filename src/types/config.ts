export type ModelProvider = 'openai' | 'anthropic' | 'gemini';

export interface Config {
  currentModel: ModelProvider;
}

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  baseURL?: string;
  headers?: Record<string, string>;
}

export const MODEL_CONFIGS: Record<ModelProvider, ModelConfig> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    baseURL: 'https://api.anthropic.com/v1'
  },
  gemini: {
    provider: 'gemini', 
    model: 'gemini-1.5-pro',
    baseURL: 'https://generativelanguage.googleapis.com/v1'
  }
};