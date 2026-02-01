import nodemailer from 'nodemailer';
import { env } from '../config/env';

const hasCredentials = Boolean(env.smtpHost && env.smtpPort);

const transporter = hasCredentials
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
    })
  : null;

export async function sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
  if (!transporter) {
    console.log('[DEV][Email fallback] Sending email', { ...options, from: env.smtpFrom });
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    ...options,
  });
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

export const emailTransportConfigured = hasCredentials;
