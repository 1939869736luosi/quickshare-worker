export const CONTENT_TYPES = {
  HTML: 'html',
  MARKDOWN: 'markdown',
  SVG: 'svg',
  MERMAID: 'mermaid',
  AUTO: 'auto',
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export function normalizeContentType(input?: string | null): ContentType | null {
  if (!input) return null;
  const value = input.toLowerCase().trim();
  if (value === 'md') return CONTENT_TYPES.MARKDOWN;
  if (value === 'markdown') return CONTENT_TYPES.MARKDOWN;
  if (value === 'svg') return CONTENT_TYPES.SVG;
  if (value === 'mermaid') return CONTENT_TYPES.MERMAID;
  if (value === 'html' || value === 'xml') return CONTENT_TYPES.HTML;
  if (value === 'auto') return CONTENT_TYPES.AUTO;
  return null;
}

export function detectContentType(content?: string | null): ContentType {
  if (!content || typeof content !== 'string') return CONTENT_TYPES.HTML;
  const trimmed = content.trim();

  if (trimmed.startsWith('<!DOCTYPE html>') || trimmed.startsWith('<html')) {
    return CONTENT_TYPES.HTML;
  }
  if (trimmed.startsWith('```html')) return CONTENT_TYPES.HTML;
  if (trimmed.startsWith('```mermaid')) return CONTENT_TYPES.MERMAID;
  if (trimmed.startsWith('```svg')) return CONTENT_TYPES.SVG;

  if (
    trimmed.startsWith('<svg') &&
    trimmed.includes('</svg>') &&
    trimmed.includes('xmlns="http://www.w3.org/2000/svg"')
  ) {
    return CONTENT_TYPES.SVG;
  }

  if (trimmed.includes('```mermaid')) return CONTENT_TYPES.MERMAID;
  if (trimmed.includes('```svg')) return CONTENT_TYPES.SVG;

  const mermaidPatterns = [
    /^\s*graph\s+[A-Za-z\s]/i,
    /^\s*flowchart\s+[A-Za-z\s]/i,
    /^\s*sequenceDiagram/i,
    /^\s*classDiagram/i,
    /^\s*gantt/i,
    /^\s*pie/i,
    /^\s*erDiagram/i,
    /^\s*journey/i,
    /^\s*stateDiagram/i,
    /^\s*gitGraph/i,
  ];
  if (mermaidPatterns.some((pattern) => pattern.test(trimmed))) {
    return CONTENT_TYPES.MERMAID;
  }

  const hasHtmlTags =
    trimmed.startsWith('<') &&
    (trimmed.includes('<div') ||
      trimmed.includes('<p') ||
      trimmed.includes('<span') ||
      trimmed.includes('<h1') ||
      trimmed.includes('<body') ||
      trimmed.includes('<head') ||
      trimmed.includes('<style') ||
      trimmed.includes('<script') ||
      trimmed.includes('<link') ||
      trimmed.includes('<meta'));
  if (hasHtmlTags) return CONTENT_TYPES.HTML;

  if (isDefinitelyMarkdown(trimmed)) return CONTENT_TYPES.MARKDOWN;

  return CONTENT_TYPES.HTML;
}

function isDefinitelyMarkdown(content: string): boolean {
  const hasHeadings = /^#{1,6}\s.+/m.test(content);
  const hasListItems = /^[-*+]\s.+/m.test(content);
  const hasNumberedList = /^\d+\.\s.+/m.test(content);
  const hasBlockquotes = /^>\s.+/m.test(content);
  const hasCodeBlocks = /^```[\s\S]*?```/m.test(content);
  const hasLinks = /\[.+?\]\(.+?\)/m.test(content);
  const hasImages = /!\[.+?\]\(.+?\)/m.test(content);
  const hasTables = /\|.+\|[\s\S]*?\|.+\|/m.test(content);

  const markdownFeatureCount = [
    hasHeadings,
    hasListItems,
    hasNumberedList,
    hasBlockquotes,
    hasCodeBlocks,
    hasLinks,
    hasImages,
    hasTables,
  ].filter(Boolean).length;

  return markdownFeatureCount >= 2 || (content.length < 1000 && markdownFeatureCount >= 1);
}
