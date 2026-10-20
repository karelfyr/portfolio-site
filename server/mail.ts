/** Email via Resend's REST API. In demo mode (no key) the email is printed to the console. */
import { config, mailConnected } from './config.ts'

export type Mail = { to: string; subject: string; text: string; html: string; replyTo?: string }

export async function sendMail(mail: Mail) {
  if (!mailConnected()) {
    console.log(`[mail:demo] to=${mail.to} subject="${mail.subject}"\n${mail.text}\n`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.mail.resendKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: config.mail.from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      reply_to: mail.replyTo,
    }),
  })
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${await res.text()}`)
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** A plain, readable email: a heading and label/value rows. Same content as text and HTML. */
export function layout(heading: string, rows: [string, string | undefined | null][], footer?: string) {
  const filled = rows.filter((r): r is [string, string] => !!r[1])
  const text = [heading, '', ...filled.map(([k, v]) => `${k}: ${v}`), footer ? `\n${footer}` : ''].join('\n').trim()
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Inter',Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:28px">
<h1 style="margin:0 0 20px;font-size:20px;font-weight:600;letter-spacing:-0.01em">${escape(heading)}</h1>
<table style="border-collapse:collapse;width:100%;font-size:15px;line-height:22px">
${filled
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 16px 8px 0;color:#777;vertical-align:top;white-space:nowrap">${escape(k)}</td><td style="padding:8px 0;white-space:pre-wrap">${escape(v)}</td></tr>`,
  )
  .join('\n')}
</table>
${footer ? `<p style="margin:20px 0 0;font-size:14px;color:#777">${escape(footer)}</p>` : ''}
</div></body></html>`
  return { text, html }
}
