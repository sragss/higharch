#!/usr/bin/env node

import { ConfigService } from './services/config';

// Handle cleanup on exit
function setupCleanup() {
  const cleanup = () => {
    // Restore terminal settings
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    process.exit(0);
  };

  // Handle various exit signals
  process.on('SIGINT', cleanup);   // Ctrl+C
  process.on('SIGTERM', cleanup);  // Termination signal
  process.on('SIGQUIT', cleanup);  // Quit signal
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    cleanup();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled promise rejection:', reason);
    cleanup();
  });
}

async function main() {
  try {
    // Setup cleanup handlers first
    setupCleanup();
    
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