#!/usr/bin/env node

import 'dotenv/config';
import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text } from 'ink';
import { 
  ChatHistory, 
  InputHandler, 
  ModelSelector, 
  ApprovalPrompt,
  ChatMessage 
} from './components';
import { loadConfig, saveConfig } from './services/config';
import { ShellToolExecutor } from './services/tools';
import { ChatLoop } from './services/chat';
import { Config, ModelProvider } from './types/config';
import { ToolApprovalRequest } from './types/tools';

type AppMode = 'chat' | 'model-select' | 'approval';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<Config>(loadConfig());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentDir, setCurrentDir] = useState<string>(process.cwd());
  const [directoryListing, setDirectoryListing] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mode, setMode] = useState<AppMode>('chat');
  const [pendingApproval, setPendingApproval] = useState<ToolApprovalRequest | null>(null);

  // Services
  const [chatService, setChatService] = useState<ChatLoop | null>(null);
  const [toolExecutor] = useState(new ShellToolExecutor());

  // Available model providers
  const modelOptions: ModelProvider[] = ['openai', 'anthropic', 'gemini'];

  // Initialize chat service when config changes
  useEffect(() => {
    try {
      const service = new ChatLoop(config.currentModel);
      setChatService(service);
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error}`,
        timestamp: new Date()
      }]);
    }
  }, [config.currentModel]);

  // Load initial directory listing
  useEffect(() => {
    loadDirectoryListing();
  }, [currentDir, toolExecutor]);

  const loadDirectoryListing = useCallback(async () => {
    try {
      const result = await toolExecutor.execute('ls', { command: 'ls -la' });
      setDirectoryListing(result.output);
    } catch (err) {
      setDirectoryListing(`Error loading directory: ${err}`);
    }
  }, [toolExecutor]);

  // Handle user message submission
  const handleMessageSubmit = useCallback(async (userInput: string) => {
    if (userInput.startsWith('/model')) {
      setMode('model-select');
      return;
    }

    if (!chatService) {
      console.error('Chat service not initialized');
      return;
    }

    setIsProcessing(true);
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      await chatService.chat(userInput, {
        onToolCall: async (toolCall) => {
          console.log('Tool called:', toolCall.name, 'with args:', toolCall.args);
          
          if (toolCall.name === 'exec') {
            // Request approval for exec commands
            const approved = await handleApprovalRequest({
              toolName: toolCall.name,
              command: toolCall.args.command as string,
              args: toolCall.args
            });
            
            if (!approved) {
              return 'Command cancelled by user';
            }
          }
          
          // Execute the tool
          const result = await toolExecutor.execute(
            toolCall.name, 
            toolCall.args,
            toolCall.name === 'exec' ? 
              (req) => handleApprovalRequest(req) : 
              undefined
          );
          
          return result.success ? result.output : result.error || 'Tool execution failed';
        },
        onComplete: (message) => {
          if (message.trim()) {
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: message,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        },
        onChunk: (text) => {
          // Handle streaming text if needed
          console.log('Streaming:', text);
        },
        onError: (error) => {
          console.error('Chat error:', error);
        }
      });
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsProcessing(false);
  }, [chatService]);

  // Handle model selection
  const handleModelSelect = useCallback((provider: ModelProvider) => {
    const newConfig = { ...config, currentModel: provider };
    setConfig(newConfig);
    saveConfig(newConfig);
    setMode('chat');
    
    const switchMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Switched to ${provider}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, switchMessage]);
  }, [config]);

  // Handle approval requests
  const handleApprovalRequest = useCallback((request: ToolApprovalRequest): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingApproval(request);
      setMode('approval');
      
      // Store resolve function for later use
      (globalThis as any).resolveApproval = resolve;
    });
  }, []);

  const handleApproval = useCallback((approved: boolean) => {
    if ((globalThis as any).resolveApproval) {
      (globalThis as any).resolveApproval(approved);
      delete (globalThis as any).resolveApproval;
    }
    setPendingApproval(null);
    setMode('chat');
  }, []);

  // Render based on current mode
  if (mode === 'approval' && pendingApproval) {
    return (
      <ApprovalPrompt
        request={pendingApproval}
        onApprove={() => handleApproval(true)}
        onDeny={() => handleApproval(false)}
      />
    );
  }

  if (mode === 'model-select') {
    return (
      <ModelSelector
        currentModel={config.currentModel}
        availableModels={modelOptions}
        onSelect={handleModelSelect}
        onCancel={() => setMode('chat')}
      />
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Directory header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan">📁 {currentDir} ({config.currentModel})</Text>
        <Text color="gray">{directoryListing}</Text>
      </Box>
      
      {/* Chat history */}
      <Box flexGrow={1}>
        <ChatHistory messages={messages} isStreaming={isProcessing} />
      </Box>

      {/* Input handler */}
      <InputHandler
        onSubmit={handleMessageSubmit}
        disabled={isProcessing}
        placeholder={isProcessing ? "Processing..." : "Type your message..."}
      />
    </Box>
  );
};

// Start the app
render(<App />);