interface Frontmatter {
  readonly date?: string;
  readonly emotions?: readonly string[];
  readonly location?: string;
}

/**
 * Converts editor HTML content to Markdown with optional YAML frontmatter.
 *
 * Supports headings (h1-h6), bold, italic, unordered/ordered lists,
 * blockquotes, paragraphs, and line breaks. Inline images are stripped.
 *
 * @param html - The HTML string produced by the rich-text editor
 * @param frontmatter - Optional metadata rendered as YAML frontmatter
 * @returns A Markdown string, optionally prefixed with YAML frontmatter
 */
export function htmlToMarkdown(html: string, frontmatter?: Frontmatter): string {
  const yamlBlock = frontmatter ? buildFrontmatter(frontmatter) : '';
  const markdown = convertBody(html);

  if (yamlBlock.length === 0) {
    return markdown;
  }

  return `${yamlBlock}\n${markdown}`;
}

function buildFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ['---'];

  if (fm.date !== undefined) {
    lines.push(`date: "${fm.date}"`);
  }

  if (fm.emotions !== undefined && fm.emotions.length > 0) {
    lines.push('emotions:');
    for (const emotion of fm.emotions) {
      lines.push(`  - "${emotion}"`);
    }
  }

  if (fm.location !== undefined) {
    lines.push(`location: "${fm.location}"`);
  }

  lines.push('---');
  return lines.join('\n');
}

function convertBody(html: string): string {
  let text = html;

  // Strip inline images
  text = text.replace(/<img[^>]*>/gi, '');

  // Convert headings (h1-h6)
  for (let level = 1; level <= 6; level++) {
    const prefix = '#'.repeat(level);
    const tag = `h${level}`;
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
    text = text.replace(regex, (_match, content: string) => {
      return `${prefix} ${stripTags(content).trim()}\n`;
    });
  }

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_match, content: string) => {
    const inner = stripTags(content).trim();
    const quoted = inner
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    return `${quoted}\n`;
  });

  // Convert unordered lists
  text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (_match, content: string) => {
    return convertListItems(content, '-');
  });

  // Convert ordered lists
  text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (_match, content: string) => {
    return convertOrderedListItems(content);
  });

  // Convert bold
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, (_match, _tag: string, content: string) => {
    return `**${content}**`;
  });

  // Convert italic
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, (_match, _tag: string, content: string) => {
    return `*${content}*`;
  });

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, (_match, content: string) => {
    return `${content}\n\n`;
  });

  // Strip any remaining HTML tags
  text = stripTags(text);

  // Collapse excessive blank lines (3+ newlines -> 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Decode common HTML entities
  text = decodeEntities(text);

  return text.trim();
}

function convertListItems(listHtml: string, bullet: string): string {
  const items: string[] = [];
  const itemRegex = /<li[^>]*>(.*?)<\/li>/gi;
  let match = itemRegex.exec(listHtml);

  while (match !== null) {
    const content = match[1];
    if (content !== undefined) {
      items.push(`${bullet} ${stripTags(content).trim()}`);
    }
    match = itemRegex.exec(listHtml);
  }

  return `${items.join('\n')}\n`;
}

function convertOrderedListItems(listHtml: string): string {
  const items: string[] = [];
  const itemRegex = /<li[^>]*>(.*?)<\/li>/gi;
  let index = 1;
  let match = itemRegex.exec(listHtml);

  while (match !== null) {
    const content = match[1];
    if (content !== undefined) {
      items.push(`${index}. ${stripTags(content).trim()}`);
      index++;
    }
    match = itemRegex.exec(listHtml);
  }

  return `${items.join('\n')}\n`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
