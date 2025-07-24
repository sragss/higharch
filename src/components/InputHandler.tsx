import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface InputHandlerProps {
  onSubmit: (input: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const InputHandler: React.FC<InputHandlerProps> = ({ 
  onSubmit, 
  onCancel, 
  placeholder = "Type your message...",
  disabled = false 
}) => {
  const [inputText, setInputText] = useState<string>('');

  useInput((input: string, key: any) => {
    if (disabled) return;

    if (key.return && inputText.trim()) {
      onSubmit(inputText.trim());
      setInputText('');
    } else if (key.escape) {
      if (onCancel) {
        onCancel();
      } else {
        setInputText('');
      }
    } else if (key.backspace || key.delete) {
      setInputText(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setInputText(prev => prev + input);
    }
  });

  return (
    <Box>
      <Text color={disabled ? "gray" : "blue"}>
        💬 {inputText || (disabled ? "Processing..." : placeholder)}
      </Text>
    </Box>
  );
};