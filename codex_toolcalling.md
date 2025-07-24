Tool Definition Pattern

  Tools are defined using OpenAI's function schema format:

  // codex-cli/src/utils/agent/agent-loop.ts:87-109
  const shellFunctionTool: FunctionTool = {
    type: "function",
    name: "shell",
    description: "Runs a shell command, and returns its output.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        command: { type: "array", items: { type: "string" } },
        workdir: { type: "string", description: "The working directory for the command." },
        timeout: { type: "number", description: "The maximum time to wait for the command to complete in milliseconds." },
      },
      required: ["command"],
      additionalProperties: false,
    },
  };

  Tool Call Processing

  Tool calls are handled in the agent loop:

  // codex-cli/src/utils/agent/agent-loop.ts:365-467
  private async handleFunctionCall(item: ResponseFunctionToolCall): Promise<Array<ResponseInputItem>> {
    const args = parseToolCallArguments(rawArguments ?? "{}");

    if (name === "container.exec" || name === "shell") {
      const { outputText, metadata } = await handleExecCommand(
        args,
        this.config,
        this.approvalPolicy,
        this.additionalWritableRoots,
        this.getCommandConfirmation,
        this.execAbortController?.signal,
      );
      outputItem.output = JSON.stringify({ output: outputText, metadata });
    }

    return [outputItem, ...additionalItems];
  }

  CLI Command Execution

  Commands like ls are executed through a sandboxed system:

  // codex-cli/src/utils/agent/sandbox/raw-exec.ts:21-214
  export function exec(command: Array<string>, options: SpawnOptions, config: AppConfig, abortSignal?: AbortSignal):
  Promise<ExecResult> {
    const adaptedCommand = adaptCommandForPlatform(command);

    const child: ChildProcess = spawn(prog, adaptedCommand.slice(1), {
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    // Handle output collection and process management
    const stdoutCollector = createTruncatingCollector(child.stdout!, maxBytes, maxLines);
    const stderrCollector = createTruncatingCollector(child.stderr!, maxBytes, maxLines);
  }

  The key files are:
  - codex-cli/src/utils/agent/agent-loop.ts - Main agent loop and tool handling
  - codex-cli/src/utils/agent/handle-exec-command.ts - Command approval system
  - codex-cli/src/utils/agent/exec.ts - Sandboxed execution
  - codex-cli/src/utils/agent/sandbox/raw-exec.ts - Raw command execution