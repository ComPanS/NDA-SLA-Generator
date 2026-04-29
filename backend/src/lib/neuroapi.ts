import axios, { AxiosError } from 'axios';
import { env } from '../config/env';

/** LLM call failed after retries or non-recoverable HTTP error (e.g. 401). Catch in routes and return 502. */
export class LlmInvocationError extends Error {
  override readonly name = 'LlmInvocationError';

  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly axiosCode?: string,
    public readonly responseSnippet?: string,
  ) {
    super(message);
  }
}

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

function responseDataSnippet(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const data = err.response?.data;
  if (data == null) return undefined;
  if (typeof data === 'string') return data.slice(0, 500);
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return undefined;
  }
}

function toLlmInvocationError(lastError: unknown): LlmInvocationError {
  if (lastError instanceof LlmInvocationError) {
    return lastError;
  }
  if (axios.isAxiosError(lastError)) {
    const status = lastError.response?.status;
    const snippet = responseDataSnippet(lastError);
    const base = status
      ? `LLM API HTTP ${status}${snippet ? ` — ${snippet}` : ''}`
      : `LLM request failed: ${lastError.message}`;
    return new LlmInvocationError(base, status, lastError.code, snippet);
  }
  if (lastError instanceof Error) {
    return new LlmInvocationError(lastError.message);
  }
  return new LlmInvocationError(String(lastError));
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
          console.warn('[neuroapi] immediate retry after empty response', {
            nextAttempt: attempt + 1,
          });
        }
        continue;
      }

      throw new LlmInvocationError('LLM returned empty message content after retries');
    } catch (err) {
      if (err instanceof LlmInvocationError) {
        throw err;
      }
      lastError = err;
      const summary = axiosErrorSummary(err);
      const retryable = isRetryableAxiosError(err);
      console.error('[neuroapi] generateText attempt failed', {
        attempt,
        maxAttempts,
        retryable,
        summary,
        model: env.neuroapiModel,
        url,
        status: axios.isAxiosError(err) ? err.response?.status : undefined,
        responseSnippet: responseDataSnippet(err),
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

  console.error('[neuroapi] generateText giving up', {
    configuredMaxAttempts: maxAttempts,
    msg: axiosErrorSummary(lastError),
    model: env.neuroapiModel,
    url,
    status: axios.isAxiosError(lastError) ? lastError.response?.status : undefined,
    responseSnippet: responseDataSnippet(lastError),
  });
  throw toLlmInvocationError(lastError);
}
