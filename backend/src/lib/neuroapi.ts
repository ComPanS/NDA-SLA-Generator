import axios from 'axios';
import { env } from '../config/env';

/**
 * NeuroAPI — OpenAI-совместимый API (grok-4-fast-non-reasoning и др.)
 */
export async function generateText(prompt: string): Promise<string> {
  if (!env.neuroapiApiKey) {
    return `Draft content generated locally:\n\n${prompt}`;
  }

  const url = `${env.neuroapiBaseUrl.replace(/\/$/, '')}/chat/completions`;

  try {
    const response = await axios.post(
      url,
      {
        model: env.neuroapiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      },
      {
        timeout: env.neuroapiTimeoutMs,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.neuroapiApiKey}`,
        },
      },
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      return `No content returned.\n\n${prompt}`;
    }
    return text;
  } catch {
    return `LLM generation failed.\n\n${prompt}`;
  }
}
