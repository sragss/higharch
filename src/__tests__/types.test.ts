import { MODEL_CONFIGS, ModelProvider } from '../types/config';
import { EXEC_TOOL, LS_TOOL, ALL_TOOLS } from '../types/tools';

describe('Config Types', () => {
  test('MODEL_CONFIGS contains all providers', () => {
    const providers: ModelProvider[] = ['openai', 'anthropic', 'gemini'];
    providers.forEach(provider => {
      expect(MODEL_CONFIGS[provider]).toBeDefined();
      expect(MODEL_CONFIGS[provider].provider).toBe(provider);
      expect(MODEL_CONFIGS[provider].model).toBeTruthy();
    });
  });

  test('OpenAI config is basic', () => {
    expect(MODEL_CONFIGS.openai.baseURL).toBeUndefined();
    expect(MODEL_CONFIGS.openai.headers).toBeUndefined();
  });

  test('Anthropic and Gemini configs have custom settings', () => {
    expect(MODEL_CONFIGS.anthropic.baseURL).toBeTruthy();
    expect(MODEL_CONFIGS.anthropic.headers).toBeDefined();
    expect(MODEL_CONFIGS.gemini.baseURL).toBeTruthy();
  });
});

describe('Tool Types', () => {
  test('EXEC_TOOL has correct structure', () => {
    expect(EXEC_TOOL.type).toBe('function');
    expect(EXEC_TOOL.name).toBe('exec');
    expect(EXEC_TOOL.parameters).toBeDefined();
    expect(EXEC_TOOL.parameters?.required).toContain('command');
  });

  test('LS_TOOL has correct structure', () => {
    expect(LS_TOOL.type).toBe('function');
    expect(LS_TOOL.name).toBe('ls');
    expect(LS_TOOL.parameters).toBeDefined();
    expect(LS_TOOL.parameters?.required).toContain('command');
  });

  test('ALL_TOOLS contains both tools', () => {
    expect(ALL_TOOLS).toHaveLength(2);
    expect(ALL_TOOLS).toContain(EXEC_TOOL);
    expect(ALL_TOOLS).toContain(LS_TOOL);
  });
});