import OpenAI from 'openai';
import type {
  ResponseCreateParams,
  ResponseInputItem,
  ResponseStreamEvent,
  ResponseCompletedEvent,
  Response as OpenAIResponse
} from "openai/resources/responses/responses";
import { ChatService, StreamingChatCallback, ToolCall } from '../types/chat';
import { MODEL_CONFIG } from '../types/config';
import { ALL_TOOLS } from '../types/tools';

export class ChatLoop implements ChatService {
  private oai: OpenAI;
  private conversationHistory: ResponseInputItem[] = [];
  private lastResponseId?: string;

  constructor() {
    // Check if ECHO_API_KEY is set
    if (!process.env.ECHO_API_KEY) {
      throw new Error('ECHO_API_KEY environment variable is not set');
    }

    // Create OpenAI client with Echo API configuration
    this.oai = new OpenAI({
      apiKey: process.env.ECHO_API_KEY,
      baseURL: MODEL_CONFIG.baseURL,
      timeout: 120000
    });
  }

  addUserMessage(text: string): void {
    const userMessage: ResponseInputItem = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text }],
    };
    this.conversationHistory.push(userMessage);
  }

  async chat(userInput: string, callbacks?: StreamingChatCallback): Promise<void> {
    this.addUserMessage(userInput);

    const instructions = "You are a helpful assistant that helps organize and sort folders. You can execute shell commands using the provided tools. Use the 'ls' tool to list directory contents and the 'exec' tool for file operations like moving, copying, and organizing files.";

    try {
      // For Responses API, we only send the current message if no previous response
      const input = this.lastResponseId ? 
        [this.conversationHistory[this.conversationHistory.length - 1]] : 
        this.conversationHistory;

      console.log('=== API Call Debug ===');
      console.log('Previous response ID:', this.lastResponseId);
      console.log('Conversation history length:', this.conversationHistory.length);
      console.log('Input being sent:', JSON.stringify(input, null, 2));
      console.log('======================');

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`API call timed out after ${this.oai.timeout}ms`));
        }, this.oai.timeout || 120000);
      });

      // Create the API call promise - use non-streaming since Echo API doesn't support streaming
      const apiPromise = this.oai.responses.create({
        model: MODEL_CONFIG.model,
        instructions,
        input,
        stream: false,
        parallel_tool_calls: false,
        tools: ALL_TOOLS,
        tool_choice: "auto",
        store: true,
        previous_response_id: this.lastResponseId,
      } satisfies ResponseCreateParams);

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;

      // Handle non-streaming response
      await this.handleNonStreamingResponse(response, callbacks);

    } catch (error) {
      console.error('Echo API call failed:', error);
      if (callbacks?.onError) {
        callbacks.onError(error as Error);
      }
      throw error;
    }
  }

  private async handleNonStreamingResponse(
    response: OpenAIResponse,
    callbacks?: StreamingChatCallback
  ): Promise<void> {
    this.lastResponseId = response.id;
    
    // Process function calls if they exist
    if (callbacks?.onToolCall) {
      const functionOutputs = await this.processFunctionCalls(response, callbacks.onToolCall);
      
      // If we had tool calls, we need to continue the conversation with tool results
      if (functionOutputs.length > 0) {
        console.log('=== Follow-up API Call Debug ===');
        console.log('Previous response ID:', this.lastResponseId);
        console.log('Function outputs to send:', JSON.stringify(functionOutputs, null, 2));
        console.log('================================');

        // Make another API call with only the function outputs when using previous_response_id
        const followupTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Follow-up API call timed out after ${this.oai.timeout}ms`));
          }, this.oai.timeout || 120000);
        });

        const followupApiPromise = this.oai.responses.create({
          model: MODEL_CONFIG.model,
          instructions: "You are a helpful assistant that helps organize and sort folders. Continue the conversation with the tool results.",
          input: functionOutputs, // Only send the function outputs
          stream: false, // Use non-streaming for follow-up calls too
          parallel_tool_calls: false,
          tools: ALL_TOOLS,
          tool_choice: "auto",
          store: true,
          previous_response_id: this.lastResponseId,
        } satisfies ResponseCreateParams);

        const followupResponse = await Promise.race([followupApiPromise, followupTimeoutPromise]) as any;
        await this.handleNonStreamingResponse(followupResponse, callbacks);
        return;
      }
    }
    
    // Extract text content for callback
    for (const item of response.output) {
      if (item.type === 'message') {
        // Extract text content for callback
        if (callbacks?.onComplete && item.content) {
          const textContent = item.content
            .filter((c: any) => c.type === 'output_text')
            .map((c: any) => c.text)
            .join('');
          if (textContent) {
            callbacks.onComplete(textContent);
          }
        }
      }
    }
  }

  private async processFunctionCalls(
    response: OpenAIResponse,
    onToolCall: (toolCall: ToolCall) => Promise<string>
  ): Promise<ResponseInputItem[]> {
    const functionOutputs: ResponseInputItem[] = [];
    
    // Process all function calls from the response
    for (const item of response.output) {
      if (item.type === 'function_call') {
        const toolCall: ToolCall = {
          id: item.call_id,
          name: item.name,
          args: JSON.parse(item.arguments)
        };

        const output = await onToolCall(toolCall);
        console.log('Tool executed:', toolCall.name, 'Output:', output);

        // Create tool result to send back to API
        const toolResult: ResponseInputItem = {
          type: "function_call_output",
          call_id: item.call_id,
          output: output
        } as any;
        
        console.log('Adding tool result:', toolResult);
        functionOutputs.push(toolResult);
      }
    }
    
    return functionOutputs;
  }

  getHistory(): ResponseInputItem[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.lastResponseId = undefined;
  }
}