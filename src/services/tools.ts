import { spawn } from 'child_process';
import { ToolExecutor, ToolExecutionResult, ToolApprovalRequest } from '../types/tools';

export class ShellToolExecutor implements ToolExecutor {
  async execute(
    name: string, 
    args: Record<string, unknown>, 
    requestApproval?: (req: ToolApprovalRequest) => Promise<boolean>
  ): Promise<ToolExecutionResult> {
    const command = args.command as string;
    
    if (!command || typeof command !== 'string') {
      return {
        success: false,
        output: '',
        error: 'Invalid command parameter'
      };
    }

    // For exec tool, request approval
    if (name === 'exec' && requestApproval) {
      const approved = await requestApproval({
        toolName: name,
        command,
        args
      });
      
      if (!approved) {
        return {
          success: false,
          output: 'Command cancelled by user',
          error: 'User denied approval'
        };
      }
    }

    return this.executeShellCommand(command);
  }

  private executeShellCommand(command: string): Promise<ToolExecutionResult> {
    return new Promise((resolve) => {
      const child = spawn('bash', ['-c', command], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout || 'Command completed successfully'
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: `Command failed (exit code ${code}): ${stderr}`
          });
        }
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: `Process error: ${err.message}`
        });
      });
    });
  }
}