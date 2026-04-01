import axios, { AxiosError } from 'axios';
import { env } from '../config/env';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAxiosError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === 400 || status === 401 || status === 403) return false;
  if (status === 429 || status === 408) return true;
  if (status !== undefined && status >= 500) return true;
  // Network, DNS, timeout (no response)
  if (!err.response) return true;
  return false;
}

function axiosErrorSummary(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError;
    const status = ax.response?.status;
    const code = ax.code;
    return [code, status, ax.message].filter(Boolean).join(' ');
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * NeuroAPI — OpenAI-совместимый API (grok-4-fast-non-reasoning и др.)
 * Повторяет запрос при обрыве, таймауте, 5xx и пустом теле ответа.
 */
export async function generateText(prompt: string): Promise<string> {
  if (!env.neuroapiApiKey) {
    return `Draft content generated locally:\n\n${prompt}`;
  }

  const url = `${env.neuroapiBaseUrl.replace(/\/$/, '')}/chat/completions`;
  const maxAttempts = env.neuroapiMaxRetries;
  const baseDelay = env.neuroapiRetryBaseDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      if (typeof text === 'string' && text.trim().length > 0) {
        if (attempt > 1) {
          console.warn('[neuroapi] generateText succeeded after retry', {
            attempt,
            maxAttempts,
            model: env.neuroapiModel,
          });
        }
        return text;
      }

      lastError = new Error('empty LLM response body');
      console.warn('[neuroapi] empty or missing choices[0].message.content', {
        attempt,
        maxAttempts,
        model: env.neuroapiModel,
        status: response.status,
      });

      if (attempt < maxAttempts) {
        const wait = attempt * baseDelay;
        if (wait > 0) {
          console.warn('[neuroapi] retrying after empty response', {
            waitMs: wait,
            nextAttempt: attempt + 1,
          });
          await sleep(wait);
        } else {
          console.warn('[neuroapi] immediate retry after empty response', { nextAttempt: attempt + 1 });
        }
        continue;
      }

      return `No content returned.\n\n${prompt}`;
    } catch (err) {
      lastError = err;
      const summary = axiosErrorSummary(err);
      const retryable = isRetryableAxiosError(err);
      console.error('[neuroapi] generateText attempt failed', {
        attempt,
        maxAttempts,
        retryable,
        summary,
        model: env.neuroapiModel,
      });

      if (retryable && attempt < maxAttempts) {
        const wait = attempt * baseDelay;
        if (wait > 0) {
          console.warn('[neuroapi] retrying', { waitMs: wait, nextAttempt: attempt + 1 });
          await sleep(wait);
        } else {
          console.warn('[neuroapi] immediate retry', { nextAttempt: attempt + 1 });
        }
        continue;
      }

      break;
    }
  }

  const msg = lastError instanceof Error ? lastError.message : axiosErrorSummary(lastError);
  console.error('[neuroapi] generateText failed after retries', {
    attempts: maxAttempts,
    msg,
    model: env.neuroapiModel,
  });
  return `LLM generation failed.\n\n${prompt}`;
}
