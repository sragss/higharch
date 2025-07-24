import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, ModelProvider } from '../types/config';

function getConfigPaths() {
  const configDir = path.join(os.homedir(), '.hierch');
  const configFile = path.join(configDir, 'config.json');
  return { configDir, configFile };
}

export function ensureConfigDir(): void {
  const { configDir } = getConfigPaths();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

export function loadConfig(): Config {
  const { configFile } = getConfigPaths();
  ensureConfigDir();
  if (fs.existsSync(configFile)) {
    try {
      const content = fs.readFileSync(configFile, 'utf8');
      const parsed = JSON.parse(content);
      
      // Validate the config has required fields
      if (parsed && typeof parsed.currentModel === 'string') {
        return parsed as Config;
      }
    } catch (error) {
      // If config is corrupted, fall back to default
      console.warn('Config file corrupted, using default');
    }
  }
  
  // Return default config
  return { currentModel: 'openai' };
}

export function saveConfig(config: Config): void {
  const { configFile } = getConfigPaths();
  ensureConfigDir();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
  const { configFile } = getConfigPaths();
  return configFile;
}

export function isValidModelProvider(provider: string): provider is ModelProvider {
  return ['openai', 'anthropic', 'gemini'].includes(provider);
}