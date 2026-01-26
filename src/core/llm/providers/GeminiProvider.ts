import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider, LLMRequest } from '../ILLMProvider';
export class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY!);
  }

  async generate(request: LLMRequest): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: process.env.LLM_MODEL || 'gemini-1.5-pro' 
    });

    const result = await model.generateContent(request.prompt);
    const response = await result.response;
    return response.text();
  }
}