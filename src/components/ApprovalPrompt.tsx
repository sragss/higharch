import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ToolApprovalRequest } from '../types/tools';

export interface ApprovalPromptProps {
  request: ToolApprovalRequest;
  onApprove: () => void;
  onDeny: () => void;
}

export const ApprovalPrompt: React.FC<ApprovalPromptProps> = ({ 
  request, 
  onApprove, 
  onDeny 
}) => {
  useInput((input: string, key: any) => {
    if (key.return) {
      onApprove();
    } else if (key.escape) {
      onDeny();
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="yellow">⚠️  Command requires approval:</Text>
      <Text color="white">{request.command}</Text>
      <Text color="green">Press Enter to approve, Esc to cancel</Text>
    </Box>
  );
};