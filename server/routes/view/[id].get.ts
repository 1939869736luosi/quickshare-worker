import { defineHandler, getQuery, getRouterParam } from 'nitro/h3';
import { eq } from 'drizzle-orm';
import { createDB, pastes } from '../../database';
import { detectContentType } from '../../utils/content-type';
import { renderPreview } from '../../utils/render-preview';

export default defineHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const password = (query.password || query.share_password) as string | undefined;

  const cloudflare = event.context.cloudflare || event.req?.runtime?.cloudflare;
  const db = createDB(cloudflare.env.DB);
  const result = await db.select().from(pastes).where(eq(pastes.id, id!)).get();

  if (!result) {
    event.res.status = 404;
    event.res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return renderMessagePage('Not found', 'The requested page does not exist.');
  }

  if (result.expire && Date.now() > result.createTime + result.expire * 1000) {
    await db.delete(pastes).where(eq(pastes.id, id!));
    event.res.status = 410;
    event.res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return renderMessagePage('Expired', 'This page has expired.');
  }

  if (result.isProtected) {
    if (!password || password !== result.sharePassword) {
      event.res.status = 401;
      event.res.headers.set('Content-Type', 'text/html; charset=utf-8');
      return renderPasswordPage(id || '', password ? 'Wrong password.' : '');
    }
  }

  const contentType = result.contentType || detectContentType(result.content);
  const html = renderPreview(result.content, contentType);

  event.res.headers.set('Content-Type', 'text/html; charset=utf-8');
  event.res.headers.set(
    'Content-Security-Policy',
    [
      "sandbox allow-scripts allow-forms allow-modals allow-popups",
      "default-src 'self' https: data: blob:",
      "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' https: 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' https: data:",
    ].join('; '),
  );
  return html;
});

function renderPasswordPage(id: string, error?: string): string {
  const errorBlock = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Required</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: #f6f7fb;
        color: #111827;
      }
      .card {
        max-width: 420px;
        margin: 12vh auto;
        padding: 28px;
        border-radius: 14px;
        background: white;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
      }
      label { font-weight: 600; display: block; margin-bottom: 8px; }
      input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #d1d5db;
        margin-bottom: 12px;
      }
      button {
        width: 100%;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: #C45B3E;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
      .error {
        margin-bottom: 12px;
        color: #b91c1c;
      }
      @media (prefers-color-scheme: dark) {
        body { background: #0b1220; color: #e5e7eb; }
        .card { background: #111827; }
        input { background: #0f172a; border-color: #1f2937; color: #e5e7eb; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Password Required</h1>
      <p>This content is protected. Enter the password to view.</p>
      ${errorBlock}
      <form method="GET" action="/view/${id}">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" required />
        <button type="submit">Unlock</button>
      </form>
    </div>
  </body>
</html>`;
}

function renderMessagePage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
