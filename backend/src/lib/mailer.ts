import dns from 'node:dns';
import net from 'node:net';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

if (env.smtpDnsIpv4First) {
  dns.setDefaultResultOrder('ipv4first');
}

const hasCredentials = Boolean(env.smtpHost && env.smtpPort);

function hostLooksLikeIp(host: string): boolean {
  const h =
    host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  return Boolean(h && net.isIP(h));
}

function domainFromEnvelopeAddress(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  const angle = s.match(/<([^>]+@[^>]+)>/);
  const addr = (angle ? angle[1] : s).trim();
  const at = addr.lastIndexOf('@');
  if (at <= 0 || at === addr.length - 1) return undefined;
  const d = addr.slice(at + 1).toLowerCase();
  return d || undefined;
}

/** EHLO/HELO имя: на Ubuntu/VPS дефолтный os.hostname() часто отклоняют. */
function smtpHeloName(): string | undefined {
  if (env.smtpEhloName) return env.smtpEhloName;
  const fromDomain = domainFromEnvelopeAddress(env.smtpFrom);
  if (fromDomain) return fromDomain;
  const userDomain = domainFromEnvelopeAddress(env.smtpUser);
  if (userDomain) return userDomain;
  if (env.smtpHost && !hostLooksLikeIp(env.smtpHost)) {
    return env.smtpHost.toLowerCase();
  }
  return undefined;
}

function smtpTransportOptions(): SMTPTransport.Options {
  const port = env.smtpPort;
  const secure = env.smtpSecure !== undefined ? env.smtpSecure : port === 465;
  const requireTLS =
    env.smtpRequireTls !== undefined
      ? env.smtpRequireTls
      : !secure && port === 587;

  const connectHost = env.smtpConnectHost || env.smtpHost;
  const logicalHost = env.smtpHost;

  let servername: string | undefined;
  if (env.smtpTlsServername) {
    servername = env.smtpTlsServername;
  } else if (
    connectHost &&
    logicalHost &&
    hostLooksLikeIp(connectHost) &&
    !hostLooksLikeIp(logicalHost)
  ) {
    servername = logicalHost;
  }

  const helo = smtpHeloName();

  return {
    host: connectHost,
    port,
    secure,
    requireTLS,
    dnsTimeout: env.smtpDnsTimeoutMs,
    connectionTimeout: env.smtpConnectionTimeoutMs,
    greetingTimeout: env.smtpConnectionTimeoutMs,
    socketTimeout: env.smtpConnectionTimeoutMs,
    ...(servername ? { servername } : {}),
    ...(helo ? { name: helo } : {}),
    auth: env.smtpUser
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : undefined,
    tls: {
      rejectUnauthorized: env.smtpTlsRejectUnauthorized,
      minVersion: 'TLSv1.2',
    },
  };
}

const transporter = hasCredentials ? nodemailer.createTransport(smtpTransportOptions()) : null;

export async function sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
  if (!transporter) {
    const hint =
      'Задайте SMTP_HOST и SMTP_PORT в .env (на сервере проверьте путь к .env и systemd WorkingDirectory).';
    const payload = { ...options, from: env.smtpFrom };
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`SMTP не настроен. ${hint}`);
    }
    console.warn('[Email] пропуск отправки (нет SMTP_HOST/SMTP_PORT)', payload);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.smtpFrom,
      ...options,
    });
  } catch (err) {
    const e = err as { code?: string; command?: string; message?: string };
    const connectTimeout =
      e.code === 'ETIMEDOUT' && (e.command === 'CONN' || e.command === undefined);
    let hint: string | undefined;
    if (connectTimeout) {
      hint =
        'TCP до SMTP не доходит (таймаут). Часто: VPS режет исходящие 465/587, ufw, неверный IP в SMTP_CONNECT_HOST. С сервера: nc -vz HOST 465 и nc -vz HOST 587. Попробуйте порт 587 + SMTP_SECURE=false; при блоке портов у провайдера — другой SMTP или API.';
    }
    console.error('SMTP send failed', {
      host: env.smtpConnectHost || env.smtpHost,
      port: env.smtpPort,
      code: e.code,
      command: e.command,
      message: e.message,
      ...(hint ? { hint } : {}),
    });
    throw err;
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  const subject = 'Код подтверждения аккаунта';
  const text = `Ваш код для подтверждения аккаунта: ${code}\n\nСрок действия: ${env.verificationCodeTtlMinutes} минут.`;
  const html = `
  <div style="background:#f7f9fb;padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 16px;">
                <div style="font-size:18px;font-weight:700;color:#111827;">Подтверждение аккаунта</div>
                <div style="margin-top:6px;font-size:14px;color:#4b5563;">Введите код ниже, чтобы завершить регистрацию.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;">
                <div style="background:#0ea5e9;color:#ffffff;border-radius:10px;padding:18px;text-align:center;font-size:28px;letter-spacing:6px;font-weight:800;">
                  ${code}
                </div>
                <div style="margin-top:16px;font-size:13px;color:#6b7280;line-height:1.5;">
                  Код действует ${env.verificationCodeTtlMinutes} минут. Если вы не запрашивали письмо, просто игнорируйте его.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <div style="font-size:12px;color:#9ca3af;line-height:1.6;">
                  Письмо отправлено автоматически. Не отвечайте на него.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  await sendMail({ to, subject, text, html });
}

function escapeHtmlAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const ttl = `${env.passwordResetTokenTtlMinutes}`;
  const subject = 'Восстановление пароля';
  const text = `Чтобы задать новый пароль, перейдите по ссылке (действует около ${ttl} минут):\n${resetLink}\n\nЕсли вы не запрашивали сброс, проигнорируйте это письмо.`;
  const safeHref = escapeHtmlAttr(resetLink);
  const html = `
  <div style="background:#f7f9fb;padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 28px;">
                <div style="font-size:18px;font-weight:700;color:#111827;">Восстановление пароля</div>
                <div style="margin-top:12px;font-size:14px;color:#4b5563;line-height:1.6;">
                  Чтобы задать новый пароль, перейдите
                  <a href="${safeHref}" style="color:#0ea5e9;">по&nbsp;этой&nbsp;ссылке</a>.
                  Ссылка действует примерно ${ttl}&nbsp;минут.
                </div>
                <div style="margin-top:16px;font-size:12px;color:#9ca3af;line-height:1.6;">
                  Если вы не запрашивали сброс, просто удалите это письмо.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  await sendMail({ to, subject, text, html });
}

export const emailTransportConfigured = hasCredentials;
