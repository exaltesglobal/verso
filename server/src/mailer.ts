import type { FastifyBaseLogger } from 'fastify';
import nodemailer from 'nodemailer';
import type { Config } from './config.js';

export type Mail = { to: string; subject: string; text: string; html: string };
export type Mailer = { send: (mail: Mail) => Promise<void> };

/** SMTP when SMTP_HOST is set, else Resend when RESEND_API_KEY is set; otherwise the email is printed to the log (local dev). */
export function createMailer(config: Config, log: FastifyBaseLogger): Mailer {
  if (config.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // 465 = implicit TLS; 587 upgrades with STARTTLS
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS ?? '' } : undefined,
    });
    return {
      async send(mail) {
        try {
          await transport.sendMail({ from: config.EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
        } catch (err) {
          log.error({ err: (err as Error).message }, 'SMTP rejected email');
          throw new Error('email_send_failed');
        }
      },
    };
  }
  if (!config.RESEND_API_KEY) {
    return {
      async send(mail) {
        log.info({ to: mail.to, subject: mail.subject }, `[console mailer]\n${mail.text}`);
      },
    };
  }
  return {
    async send(mail) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: config.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
      });
      if (!res.ok) {
        log.error({ status: res.status, body: (await res.text()).slice(0, 300) }, 'Resend rejected email');
        throw new Error('email_send_failed');
      }
    },
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function linkEmail(opts: { to: string; subject: string; intro: string; button: string; url: string; outro: string; logo: string }): Mail {
  const text = `${opts.intro}\n\n${opts.button}: ${opts.url}\n\n${opts.outro}\n\nVerso by Agape Labs`;
  const html = `<!doctype html><html><body style="margin:0;background:#0B0B0F;font-family:Manrope,Segoe UI,Arial,sans-serif;color:#F5F4F0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#16161C;border:1px solid #2A2A33;border-radius:14px">
<tr><td style="padding:32px">
<img src="${esc(opts.logo)}" alt="Verso" width="120" height="35" style="display:block;border:0;margin:0 0 24px">
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#B9B7BF">${esc(opts.intro)}</p>
<a href="${esc(opts.url)}" style="display:inline-block;background:#FF4A2B;color:#0B0B0F;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${esc(opts.button)}</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#B9B7BF">${esc(opts.outro)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { to: opts.to, subject: opts.subject, text, html };
}
