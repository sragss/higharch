import { MODEL_CONFIG } from '../types/config';

describe('Config Types', () => {
  test('MODEL_CONFIG has required properties', () => {
    expect(MODEL_CONFIG.model).toBeDefined();
    expect(MODEL_CONFIG.baseURL).toBeDefined();
    expect(typeof MODEL_CONFIG.model).toBe('string');
    expect(typeof MODEL_CONFIG.baseURL).toBe('string');
  });

  test('MODEL_CONFIG uses Echo API', () => {
    expect(MODEL_CONFIG.baseURL).toBe('https://echo.router.merit.systems');
    expect(MODEL_CONFIG.model).toBe('gpt-4o');
  });
});