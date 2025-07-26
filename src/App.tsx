#!/usr/bin/env node

import 'dotenv/config';
import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text } from 'ink';
import { 
  ChatHistory, 
  InputHandler, 
  ApprovalPrompt,
  ChatMessage 
} from './components';
import { ShellToolExecutor } from './services/tools';
import { ChatLoop } from './services/chat';
import { ToolApprovalRequest } from './types/tools';

type AppMode = 'chat' | 'approval';

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentDir, setCurrentDir] = useState<string>(process.cwd());
  const [directoryListing, setDirectoryListing] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mode, setMode] = useState<AppMode>('chat');
  const [pendingApproval, setPendingApproval] = useState<ToolApprovalRequest | null>(null);

  // Services
  const [chatService, setChatService] = useState<ChatLoop | null>(null);
  const [toolExecutor] = useState(new ShellToolExecutor());

  // Initialize chat service
  useEffect(() => {
    try {
      const service = new ChatLoop();
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
  }, []);

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
              return 'Command execution denied by user.';
            }
          }
          
          // Execute the tool
          const result = await toolExecutor.execute(toolCall.name, toolCall.args);
          
          // Reload directory listing if we're in the same directory
          if (toolCall.name === 'exec' || toolCall.name === 'ls') {
            await loadDirectoryListing();
          }
          
          return result.output;
        },
        onComplete: (message) => {
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        },
        onError: (error) => {
          console.error('Chat error:', error);
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${error.message}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      });
    } catch (error) {
      console.error('Failed to process message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatService]);

  // Handle approval requests
  const handleApprovalRequest = useCallback((request: ToolApprovalRequest): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('Requesting approval for:', request.command);
      setPendingApproval(request);
      setMode('approval');
      
      // Store resolve function for later use
      (globalThis as any).resolveApproval = resolve;
      
      // Set up timeout for approval (60 seconds)
      const timeoutId = setTimeout(() => {
        console.log('Approval request timed out after 60 seconds');
        if ((globalThis as any).resolveApproval === resolve) {
          // Clean up
          delete (globalThis as any).resolveApproval;
          setPendingApproval(null);
          setMode('chat');
          
          // Resolve with false (denial) on timeout
          resolve(false);
        }
      }, 60000);
      
      // Store timeout ID for cleanup
      (globalThis as any).approvalTimeoutId = timeoutId;
    });
  }, []);

  const handleApproval = useCallback((approved: boolean) => {
    if ((globalThis as any).resolveApproval) {
      console.log('Approval resolved:', approved);
      (globalThis as any).resolveApproval(approved);
      delete (globalThis as any).resolveApproval;
    }
    
    // Clear timeout if it exists
    if ((globalThis as any).approvalTimeoutId) {
      clearTimeout((globalThis as any).approvalTimeoutId);
      delete (globalThis as any).approvalTimeoutId;
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

  return (
    <Box flexDirection="column" height="100%">
      {/* Directory header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan">📁 {currentDir} (Echo API)</Text>
        <Text color="gray">{directoryListing}</Text>
      </Box>
      
      {/* Chat history */}
      <Box flexGrow={1}>
        <ChatHistory messages={messages} isStreaming={isProcessing} />
      </Box>

      {/* Input handler */}
      <InputHandler onSubmit={handleMessageSubmit} disabled={isProcessing} />
    </Box>
  );
};

render(<App />);