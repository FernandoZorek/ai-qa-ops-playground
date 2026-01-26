import { OpenAI } from 'openai';
import { ILLMProvider, LLMRequest } from '../ILLMProvider';
export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
    });
  }

  async generate(request: LLMRequest): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert QA Automation Engineer.' },
        { role: 'user', content: request.prompt }
      ],
      temperature: Number(process.env.LLM_TEMPERATURE) || 0.2,
    });

    return response.choices[0].message.content || '';
  }
}