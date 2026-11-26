import { Marked, Renderer } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { codeToHtml } from 'shiki';
import { slugify } from './text';

export interface Heading {
  depth: number;
  text: string;
  slug: string;
}

const decode = (s: string) =>
  s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');

const SAFE = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'h1', 'h2', 'h3', 'h4', 'figure', 'figcaption', 'del', 'details', 'summary', 'hr', 'kbd',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'],
    th: ['align'], td: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (tag: string, attribs: Record<string, string>) => {
      const external = /^https?:/.test(attribs.href ?? '');
      return { tagName: 'a', attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs };
    },
  },
};

// Markdown → safe HTML. Code blocks get Shiki highlighting (light and dark colours as CSS variables).
export async function renderMarkdown(md: string): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = [];
  const renderer = new Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const plain = text.replace(/<[^>]+>/g, '');
    const slug = slugify(plain) || `muc-${headings.length + 1}`;
    if (depth === 2 || depth === 3) headings.push({ depth, text: decode(plain), slug });
    return `<h${depth} id="${slug}">${text}</h${depth}>\n`;
  };
  const marked = new Marked({ renderer, gfm: true, breaks: false });
  const raw = (await marked.parse(md ?? '')) as string;
  const clean = sanitizeHtml(raw, SAFE);

  // swap each <pre><code class="language-x"> for Shiki's output
  const blocks = [...clean.matchAll(/<pre><code(?: class="language-([\w+#-]+)")?>([\s\S]*?)<\/code><\/pre>/g)];
  let html = clean;
  for (const m of blocks) {
    const code = decode(m[2]).replace(/\n$/, '');
    let out: string;
    try {
      out = await codeToHtml(code, {
        lang: m[1] || 'text',
        themes: { light: 'github-light', dark: 'github-dark-dimmed' },
        defaultColor: false,
      });
    } catch {
      out = await codeToHtml(code, { lang: 'text', themes: { light: 'github-light', dark: 'github-dark-dimmed' }, defaultColor: false });
    }
    html = html.replace(m[0], () => out);
  }
  return { html, headings };
}
