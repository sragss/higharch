import { ChatMessage, ToolApprovalRequest } from '../types';

describe('Component Types', () => {
  test('ChatMessage has correct structure', () => {
    const message: ChatMessage = {
      id: '123',
      role: 'user',
      content: 'Hello world',
      timestamp: new Date()
    };

    expect(message.id).toBe('123');
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello world');
    expect(message.timestamp).toBeInstanceOf(Date);
  });

  test('ToolApprovalRequest has correct structure', () => {
    const request: ToolApprovalRequest = {
      toolName: 'exec',
      command: 'rm -rf /tmp/test',
      args: { command: 'rm -rf /tmp/test' }
    };

    expect(request.toolName).toBe('exec');
    expect(request.command).toBe('rm -rf /tmp/test');
    expect(request.args).toBeDefined();
  });
});