export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
}

export interface ILLMProvider {
  /**
   * Generates a text response based on the provided prompt.
   * @param request The prompt and optional system context.
   */
  generate(request: LLMRequest): Promise<string>;
}