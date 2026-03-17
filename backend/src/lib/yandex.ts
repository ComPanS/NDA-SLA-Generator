import axios from 'axios';
import { env } from '../config/env';
import { generateText as neuroapiGenerateText } from './neuroapi';

// Используем NeuroAPI
export async function generateText(prompt: string): Promise<string> {
  return neuroapiGenerateText(prompt);
}

/*
// YandexGPT (закомментировано — используется NeuroAPI)
export async function generateTextYandex(prompt: string): Promise<string> {
  if (!env.yandexApiKey || !env.yandexFolderId) {
    return `Draft content generated locally:\n\n${prompt}`;
  }

  const modelUri = `gpt://${env.yandexFolderId}/${env.yandexModel}`;

  try {
    const response = await axios.post(
      env.yandexEndpoint,
      {
        modelUri,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 1200,
        },
        messages: [
          {
            role: 'user',
            text: prompt,
          },
        ],
      },
      {
        timeout: env.yandexTimeoutMs,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Api-Key ${env.yandexApiKey}`,
        },
      },
    );

    const text = response.data?.result?.alternatives?.[0]?.message?.text;
    if (!text) {
      return `No content returned.\n\n${prompt}`;
    }
    return text;
  } catch {
    return `LLM generation failed.\n\n${prompt}`;
  }
}
*/
