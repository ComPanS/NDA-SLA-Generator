import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { generateText, LlmInvocationError } from '../lib/neuroapi';

vi.mock('../config/env', () => ({
  env: {
    neuroapiApiKey: 'test-api-key',
    neuroapiBaseUrl: 'https://example.invalid/v1',
    neuroapiModel: 'test-model',
    neuroapiTimeoutMs: 5000,
    neuroapiMaxRetries: 3,
    neuroapiRetryBaseDelayMs: 0,
  },
}));

vi.mock('axios', async (importOriginal) => {
  const mod = await importOriginal<typeof import('axios')>();
  return {
    ...mod,
    default: {
      ...mod.default,
      post: vi.fn(),
    },
  };
});

describe('neuroapi generateText', () => {
  const mockedPost = vi.mocked(axios.post);

  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('returns success message content', async () => {
    mockedPost.mockResolvedValueOnce({
      status: 200,
      data: {
        choices: [{ message: { content: '  Hello contract  ' } }],
      },
    });

    await expect(generateText('prompt')).resolves.toBe('  Hello contract  ');
    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost.mock.calls[0]?.[0]).toBe('https://example.invalid/v1/chat/completions');
  });

  it('throws LlmInvocationError on HTTP 401 (request fails before billed usage)', async () => {
    mockedPost.mockRejectedValueOnce(
      new axios.AxiosError(
        'Unauthorized',
        '401',
        {} as never,
        {},
        {
          status: 401,
          data: { error: 'invalid_api_key' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as never,
        },
      ),
    );

    await expect(generateText('x')).rejects.toMatchObject({
      httpStatus: 401,
      name: 'LlmInvocationError',
    });
  });

  it('retries on HTTP 503 then succeeds', async () => {
    mockedPost
      .mockRejectedValueOnce(
        new axios.AxiosError(
          'Bad Gateway',
          '503',
          {} as never,
          {},
          {
            status: 503,
            data: {},
            statusText: 'Bad Gateway',
            headers: {},
            config: {} as never,
          },
        ),
      )
      .mockResolvedValueOnce({
        status: 200,
        data: { choices: [{ message: { content: 'OK after retry' } }] },
      });

    await expect(generateText('p')).resolves.toBe('OK after retry');
    expect(mockedPost).toHaveBeenCalledTimes(2);
  });

  it('throws when response body is empty after all retries', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { choices: [{ message: { content: '' } }] },
    });

    await expect(generateText('p')).rejects.toThrow(LlmInvocationError);
    expect(mockedPost.mock.calls.length).toBe(3);
  });
});
