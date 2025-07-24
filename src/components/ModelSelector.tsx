import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ModelProvider } from '../types/config';

export interface ModelSelectorProps {
  currentModel: ModelProvider;
  availableModels: readonly ModelProvider[];
  onSelect: (model: ModelProvider) => void;
  onCancel: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  currentModel, 
  availableModels, 
  onSelect, 
  onCancel 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => 
    availableModels.findIndex(m => m === currentModel) || 0
  );

  useInput((input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(availableModels.length - 1, prev + 1));
    } else if (key.return) {
      onSelect(availableModels[selectedIndex]);
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan">Select model provider:</Text>
      {availableModels.map((model, index) => (
        <Text key={model} color={index === selectedIndex ? 'green' : 'white'}>
          {index === selectedIndex ? '> ' : '  '}{model}
        </Text>
      ))}
      <Text color="gray">Use arrows to navigate, Enter to select, Esc to cancel</Text>
    </Box>
  );
};