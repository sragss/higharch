import type { FunctionTool } from "openai/resources/responses/responses";

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface ToolApprovalRequest {
  toolName: string;
  command: string;
  args?: Record<string, unknown>;
}

export interface ToolExecutor {
  execute(name: string, args: Record<string, unknown>, requestApproval?: (req: ToolApprovalRequest) => Promise<boolean>): Promise<ToolExecutionResult>;
}

export const EXEC_TOOL: FunctionTool = {
  type: "function",
  name: "exec",
  description: "Executes mutating shell commands (mv, cp, grep, rg), requires user approval to run",
  strict: false,
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Shell command to execute"
      }
    },
    required: ["command"],
    additionalProperties: false,
  },
};

export const LS_TOOL: FunctionTool = {
  type: "function",
  name: "ls", 
  description: "Executes a list command, does not require user approval to run, cannot look inside files",
  strict: false,
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "ls command with any flags (e.g., 'ls -la', 'tree')"
      }
    },
    required: ["command"],
    additionalProperties: false,
  },
};

export const ALL_TOOLS: FunctionTool[] = [EXEC_TOOL, LS_TOOL];