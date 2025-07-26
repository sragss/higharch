export interface Config {
  // No longer need currentModel since we only support OpenAI/Echo
}

export interface ModelConfig {
  model: string;
  baseURL: string;
}

// Simplified config - only OpenAI/Echo API
export const MODEL_CONFIG: ModelConfig = {
  model: 'gpt-4o',
  baseURL: 'https://echo.router.merit.systems'
};