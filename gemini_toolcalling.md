  Tools extend BaseTool and define their schema:

  export class ShellTool extends BaseTool<ShellToolParams, ToolResult> {
    static Name: string = 'run_shell_command';

    constructor(private readonly config: Config) {
      super(
        ShellTool.Name,
        'Shell',
        'This tool executes a given shell command...',
        Icon.Terminal,
        {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: 'Exact bash command to execute',
            },
            description: {
              type: Type.STRING,
              description: 'Brief description of the command',
            },
          },
          required: ['command'],
        }
      );
    }

    async execute(params: ShellToolParams, signal: AbortSignal): Promise<ToolResult> {
      const shell = spawn('bash', ['-c', params.command], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: path.resolve(this.config.getTargetDir(), params.directory || ''),
      });

      return {
        llmContent: `Command: ${params.command}\nStdout: ${stdout}...`,
        returnDisplay: `Command executed successfully`
      };
    }
  }

  LS Tool Implementation

  export class LSTool extends BaseTool<LSToolParams, ToolResult> {
    static readonly Name = 'list_directory';

    async execute(params: LSToolParams): Promise<ToolResult> {
      const files = fs.readdirSync(params.path);

      for (const file of files) {
        if (this.shouldIgnore(file, params.ignore)) continue;
        // Process files...
      }

      return {
        llmContent: `Directory listing for ${params.path}:\n${directoryContent}`,
        returnDisplay: `Listed ${entries.length} item(s).`
      };
    }
  }

  Tool Registration & API Integration

  Tools are registered in packages/core/src/config/config.ts:615-623 and sent to the API:

  // Registration
  registerCoreTool(ShellTool, this);
  registerCoreTool(LSTool, this);

  // API Integration (client.ts:163-168)
  async setTools(): Promise<void> {
    const toolRegistry = await this.config.getToolRegistry();
    const toolDeclarations = toolRegistry.getFunctionDeclarations();
    const tools: Tool[] = [{ functionDeclarations: toolDeclarations }];
    this.getChat().setTools(tools);
  }

  The key files are:
  - packages/core/src/tools/shell.ts - Shell command execution
  - packages/core/src/tools/ls.ts - Directory listing
  - packages/core/src/tools/tool-registry.ts - Tool management
  - packages/core/src/core/coreToolScheduler.ts - Tool execution orchestration