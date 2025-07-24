import React from 'react';
import { Box, Text } from 'ink';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistoryProps {
  messages: readonly ChatMessage[];
  isStreaming?: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isStreaming = false }) => {
  if (messages.length === 0 && !isStreaming) {
    return (
      <Box flexDirection="column">
        <Text color="gray">No messages yet. Type something to get started!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      {messages.length > 0 && <Text color="gray">--- Chat History ---</Text>}
      {messages.map((msg) => (
        <Text key={msg.id} color={msg.role === 'user' ? 'green' : 'white'}>
          {msg.role === 'user' ? '> ' : '🤖 '}{msg.content}
        </Text>
      ))}
      {isStreaming && <Text color="yellow">🤖 Processing...</Text>}
      {messages.length > 0 && <Text color="gray">--- End History ---</Text>}
    </Box>
  );
};