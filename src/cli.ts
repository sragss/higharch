#!/usr/bin/env node

import { ConfigService } from './services/config';

async function main() {
  try {
    console.log('🚀 Starting higharch...\n');
    
    // Initialize config service and ensure API key is available
    // This will handle the entire authentication flow if needed
    const configService = new ConfigService();
    const apiKey = await configService.getApiKey();
    
    // Validate the API key format
    if (!apiKey.startsWith('echo_')) {
      console.error('❌ Invalid API key format. Echo API keys should start with "echo_".');
      process.exit(1);
    }
    
    console.log('✅ Authentication successful!\n');
    
    // If we get here, authentication is complete and valid
    // Now start the main app by importing App.tsx which handles its own rendering
    await import('./App');
  } catch (error) {
    console.error('❌ Failed to start higharch:', error);
    process.exit(1);
  }
}

main(); 