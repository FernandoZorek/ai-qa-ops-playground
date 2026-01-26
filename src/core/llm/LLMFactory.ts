import { OpenAIProvider } from './providers/OpenAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { ILLMProvider } from './ILLMProvider';

export class LLMFactory {
  static create(): ILLMProvider {
    const provider = process.env.LLM_PROVIDER?.toLowerCase();

    switch (provider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      default:
        throw new Error(`Provider [${provider}] is not supported or not defined in .env`);
    }
  }
}