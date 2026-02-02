import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { useYandexSuggest } from '../hooks/useAuth';

declare global {
  interface Window {
    YaAuthSuggest?: {
      init: (
        params: { client_id: string; response_type: 'token'; redirect_uri: string },
        origin: string,
        options: Record<string, unknown>
      ) => Promise<{ handler: () => Promise<{ access_token?: string }> }>;
    };
  }
}

const SDK_URL =
  'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
const LOAD_TIMEOUT_MS = 8000;
const AUTH_FLOW_TIMEOUT_MS = 10000;

interface Props {
  disabled?: boolean;
}

export const YandexIdButton = ({ disabled }: Props) => {
  const containerId = useRef(`yandex-login-${Math.random().toString(36).slice(2)}`);
  const handlerSettledRef = useRef(false);
  const handlerRef = useRef<(() => Promise<{ access_token?: string }>) | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isLoadingSdk, setIsLoadingSdk] = useState(false);
  const [isAuthFlow, setIsAuthFlow] = useState(false);

  const origin = useMemo(() => import.meta.env.VITE_YANDEX_ORIGIN || window.location.origin, []);
  const redirectUri = useMemo(
    () =>
      import.meta.env.VITE_YANDEX_SUGGEST_REDIRECT_URI ||
      `${window.location.origin}/oauth/yandex/token`,
    []
  );
  const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID;

  const {
    mutate: finishYandexAuth,
    isPending: isExchangePending,
    error: exchangeError,
  } = useYandexSuggest();

  const handleToken = useCallback(
    (token?: string) => {
      if (!token || handlerSettledRef.current) return;
      handlerSettledRef.current = true;
      finishYandexAuth(token, {
        onSettled: () => {
          handlerSettledRef.current = false;
          setIsAuthFlow(false);
        },
      });
    },
    [finishYandexAuth]
  );

  const runHandler = useCallback(() => {
    if (!handlerRef.current) return;
    setIsAuthFlow(true);
    const timeout = window.setTimeout(() => setIsAuthFlow(false), AUTH_FLOW_TIMEOUT_MS);

    handlerRef
      .current()
      .then((data) => {
        console.info('[YaID] handler resolved', { hasToken: Boolean(data?.access_token) });
        handleToken(data?.access_token);
      })
      .catch((error) => {
        const message = (error as Error)?.message || 'Авторизация через Яндекс отменена';
        console.error('[YaID] handler rejected', message);
        setSdkError(message);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setIsAuthFlow(false);
      });
  }, [handleToken]);

  useEffect(() => {
    let cancelled = false;

    const ensureSdk = () =>
      new Promise<void>((resolve, reject) => {
        if (window.YaAuthSuggest) {
          resolve();
          return;
        }

        const existing = document.querySelector(
          `script[src="${SDK_URL}"]`
        ) as HTMLScriptElement | null;
        const script = existing ?? document.createElement('script');
        let resolved = false;
        const timer = window.setTimeout(() => {
          if (!resolved) {
            reject(new Error('Таймаут загрузки SDK Яндекс ID (проверьте AdBlock/VPN)'));
          }
        }, LOAD_TIMEOUT_MS);

        const onLoad = () => {
          if (resolved) return;
          resolved = true;
          window.clearTimeout(timer);
          resolve();
        };

        const onError = () => {
          if (resolved) return;
          resolved = true;
          window.clearTimeout(timer);
          reject(new Error('Не удалось загрузить SDK Яндекс ID (проверьте AdBlock/VPN)'));
        };

        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });

        if (!existing) {
          script.src = SDK_URL;
          script.async = true;
          document.body.appendChild(script);
        }
      });

    const initSdk = async () => {
      setIsLoadingSdk(true);
      try {
        if (!clientId) {
          throw new Error('Не задан VITE_YANDEX_CLIENT_ID в переменных окружения фронтенда');
        }

        await ensureSdk();
        if (cancelled) return;
        if (!window.YaAuthSuggest?.init) {
          throw new Error('SDK Яндекс ID недоступен');
        }

        const { handler } = await window.YaAuthSuggest.init(
          {
            client_id: clientId,
            response_type: 'token',
            redirect_uri: redirectUri,
          },
          origin,
          {
            view: 'button',
            parentId: containerId.current,
            buttonView: 'main',
            buttonTheme: 'light',
            buttonBorderRadius: "8",
            buttonSize: 'm',
            buttonContent: 'Войти с Яндекс ID',
            popup: true,
            popupOptions: 'width=600,height=600',
          }
        );

        if (cancelled) return;
        handlerRef.current = handler;
        setSdkError(null);
        runHandler();
      } catch (error) {
        if (!cancelled) {
          setSdkError((error as Error)?.message || 'Не удалось инициализировать кнопку Яндекс ID');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSdk(false);
        }
      }
    };

    initSdk();

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; token?: string; error?: string };

      if (data?.type === 'yandex_token') {
        handleToken(data.token);
      } else if (data?.type === 'yandex_token_error' && data.error) {
        setSdkError(data.error);
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      cancelled = true;
      handlerRef.current = null;
      window.removeEventListener('message', onMessage);
    };
  }, [clientId, origin, redirectUri, runHandler, handleToken]);

  const isBlocked = disabled || isLoadingSdk || isExchangePending;

  return (
    <Box
      sx={{
        mt: 2,
        opacity: isBlocked ? 0.7 : 1,
        pointerEvents: isBlocked ? 'none' : 'auto',
      }}
      onClick={runHandler}
    >
      <div id={containerId.current} />

      {(isLoadingSdk || isAuthFlow || isExchangePending) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {/* <CircularProgress size={18} /> */}
          {/* <Typography variant="body2" color="text.secondary">
            {isExchangePending ? 'Завершаем вход...' : 'Подключаем кнопку Яндекс ID...'}
          </Typography> */}
        </Box>
      )}

      {(sdkError || exchangeError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {(sdkError || (exchangeError as Error)?.message) ?? 'Ошибка авторизации через Яндекс'}
        </Alert>
      )}
    </Box>
  );
};
