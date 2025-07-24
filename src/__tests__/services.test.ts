import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, ensureConfigDir, isValidModelProvider } from '../services/config';
import { ShellToolExecutor } from '../services/tools';

// Mock fs for config tests
jest.mock('fs');
jest.mock('os');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('Config Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOs.homedir.mockReturnValue('/home/test');
    mockFs.existsSync.mockImplementation(() => false);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.readFileSync.mockImplementation(() => '');
    mockFs.writeFileSync.mockImplementation(() => undefined);
  });

  test('ensureConfigDir creates directory if not exists', () => {
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation(() => undefined);

    ensureConfigDir();

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/home/test/.hierch', { recursive: true });
  });

  test('loadConfig returns default when no file exists', () => {
    mockFs.existsSync.mockReturnValue(false);

    const config = loadConfig();

    expect(config).toEqual({ currentModel: 'openai' });
  });

  test('loadConfig parses existing config file', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"currentModel":"anthropic"}');

    const config = loadConfig();

    expect(config).toEqual({ currentModel: 'anthropic' });
  });

  test('loadConfig handles corrupted file gracefully', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('invalid json');

    const config = loadConfig();

    expect(config).toEqual({ currentModel: 'openai' });
  });

  test('saveConfig writes to file', () => {
    mockFs.writeFileSync.mockImplementation(() => undefined);

    saveConfig({ currentModel: 'gemini' });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/home/test/.hierch/config.json',
      '{\n  "currentModel": "gemini"\n}'
    );
  });

  test('isValidModelProvider validates correctly', () => {
    expect(isValidModelProvider('openai')).toBe(true);
    expect(isValidModelProvider('anthropic')).toBe(true);
    expect(isValidModelProvider('gemini')).toBe(true);
    expect(isValidModelProvider('invalid')).toBe(false);
  });
});

describe('ShellToolExecutor', () => {
  let executor: ShellToolExecutor;

  beforeEach(() => {
    executor = new ShellToolExecutor();
  });

  test('execute rejects invalid command parameter', async () => {
    const result = await executor.execute('ls', {});
    
    expect(result).toEqual({
      success: false,
      output: '',
      error: 'Invalid command parameter'
    });
  });

  test('execute requests approval for exec tool', async () => {
    const mockApproval = jest.fn().mockResolvedValue(false);
    
    const result = await executor.execute('exec', { command: 'rm file.txt' }, mockApproval);
    
    expect(mockApproval).toHaveBeenCalledWith({
      toolName: 'exec',
      command: 'rm file.txt',
      args: { command: 'rm file.txt' }
    });
    expect(result).toEqual({
      success: false,
      output: 'Command cancelled by user',
      error: 'User denied approval'
    });
  });

  test('execute runs ls commands without approval', async () => {
    // This would need more mocking for the actual shell execution
    // For now, just test that approval is not requested
    const mockApproval = jest.fn();
    
    // We can't easily test the actual shell execution without more complex mocking
    // But we can test the approval logic
    const result = await executor.execute('ls', { command: 'ls -la' }, mockApproval);
    
    expect(mockApproval).not.toHaveBeenCalled();
    // The result will depend on actual execution, so we just check it exists
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});