import MarkdownIt from 'markdown-it';
import { CONTENT_TYPES, type ContentType } from './content-type';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const info = token.info?.trim().toLowerCase() || '';
  const content = token.content || '';

  if (info === 'mermaid') {
    return `<div class="mermaid">${escapeHtml(content)}</div>`;
  }
  if (info === 'svg') {
    return `<div class="embedded-svg">${content}</div>`;
  }
  if (defaultFence) return defaultFence(tokens, idx, options, env, self);
  return self.renderToken(tokens, idx, options);
};

export function renderPreview(content: string, contentType: ContentType): string {
  switch (contentType) {
    case CONTENT_TYPES.MARKDOWN:
      return renderMarkdown(content);
    case CONTENT_TYPES.SVG:
      return renderSvg(content);
    case CONTENT_TYPES.MERMAID:
      return renderMermaid(content);
    case CONTENT_TYPES.HTML:
    default:
      return renderHtml(content);
  }
}

function renderHtml(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('<!DOCTYPE html>') || trimmed.startsWith('<html')) {
    return content;
  }
  return basePage({
    title: 'HTML Preview',
    body: `<div class="container">${content}</div>`,
  });
}

function renderMarkdown(content: string): string {
  const html = md.render(content);
  return basePage({
    title: 'Markdown Preview',
    head: markdownHead(),
    body: `<article class="markdown-body">${html}</article>`,
    scripts: markdownScripts(),
  });
}

function renderSvg(content: string): string {
  return basePage({
    title: 'SVG Preview',
    body: `<div class="svg-container">${content}</div>`,
    head: svgHead(),
  });
}

function renderMermaid(content: string): string {
  return basePage({
    title: 'Mermaid Preview',
    head: mermaidHead(),
    body: `<div class="mermaid">${escapeHtml(content)}</div>`,
    scripts: mermaidScripts(),
  });
}

function basePage({
  title,
  head = '',
  body,
  scripts = '',
}: {
  title: string;
  head?: string;
  body: string;
  scripts?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: #f6f7fb;
        color: #111827;
      }
      .container {
        max-width: 1100px;
        margin: 24px auto;
        padding: 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
      }
      .markdown-body {
        max-width: 980px;
        margin: 24px auto;
        padding: 24px 28px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
        line-height: 1.7;
      }
      .markdown-body pre {
        overflow: auto;
        padding: 14px 16px;
        border-radius: 8px;
        background: #0f172a;
        color: #e2e8f0;
      }
      .svg-container {
        max-width: 1100px;
        margin: 24px auto;
        padding: 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
      }
      .mermaid {
        max-width: 1100px;
        margin: 24px auto;
        padding: 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
        text-align: center;
      }
      .embedded-svg {
        overflow: auto;
        max-width: 100%;
      }
      @media (prefers-color-scheme: dark) {
        body { background: #0b1220; color: #e5e7eb; }
        .container, .markdown-body, .svg-container, .mermaid { background: #111827; }
      }
    </style>
    ${head}
  </head>
  <body>
    ${body}
    ${scripts}
  </body>
</html>`;
}

function markdownHead(): string {
  return `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
  `;
}

function markdownScripts(): string {
  return `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('pre code').forEach((block) => {
          if (window.hljs) window.hljs.highlightElement(block);
        });

        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
          try {
            window.mermaid.run({ querySelector: '.mermaid' });
          } catch (e) {
            console.error('Mermaid render failed', e);
          }
        }
      });
    </script>
  `;
}

function mermaidHead(): string {
  return `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
  `;
}

function mermaidScripts(): string {
  return `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (!window.mermaid) return;
        window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
        try {
          window.mermaid.run({ querySelector: '.mermaid' });
        } catch (e) {
          console.error('Mermaid render failed', e);
        }
      });
    </script>
  `;
}

function svgHead(): string {
  return `
    <style>
      .svg-container svg { max-width: 100%; height: auto; display: block; }
    </style>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
