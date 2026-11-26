import { describe, expect, it } from 'vitest';
import { href, pick, timeAgo } from '@/lib/i18n';
import { renderMarkdown } from '@/lib/markdown';
import { containsBlocked, countLinks, parseWords } from '@/lib/rate-limit';
import { readingTime, slugify, stripDiacritics } from '@/lib/text';
import { parseYoutubeId } from '@/lib/youtube';

describe('YouTube links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw', 'jNQXAC9IVRw'],
    ['https://youtu.be/jNQXAC9IVRw?si=abc', 'jNQXAC9IVRw'],
    ['https://m.youtube.com/watch?v=jNQXAC9IVRw&t=10', 'jNQXAC9IVRw'],
    ['https://www.youtube.com/shorts/jNQXAC9IVRw', 'jNQXAC9IVRw'],
    ['https://www.youtube.com/embed/jNQXAC9IVRw', 'jNQXAC9IVRw'],
    ['jNQXAC9IVRw', 'jNQXAC9IVRw'],
  ])('%s', (input, id) => expect(parseYoutubeId(input)).toBe(id));

  it.each(['', 'not a link', 'https://vimeo.com/123', 'https://youtube.com/watch?v=short', 'javascript:alert(1)'])('rejects %s', (input) =>
    expect(parseYoutubeId(input)).toBeNull(),
  );
});

describe('text helpers', () => {
  it('removes Vietnamese accents', () => expect(stripDiacritics('Đà Nẵng ghi chép')).toBe('Da Nang ghi chep'));
  it('makes slugs', () => expect(slugify('  Xin chào, Đà Nẵng! ')).toBe('xin-chao-da-nang'));
  it('reading time ignores code and is at least 1', () => {
    expect(readingTime('```\n' + 'code '.repeat(1000) + '\n```')).toBe(1);
    expect(readingTime('từ '.repeat(1000))).toBe(5);
  });
});

describe('languages', () => {
  it('prefixes English paths', () => {
    expect(href('vi', '/blog')).toBe('/blog');
    expect(href('en', '/blog')).toBe('/en/blog');
    expect(href('en', '/')).toBe('/en');
  });
  it('falls back to Vietnamese', () => {
    expect(pick('en', 'Xin chào', null)).toBe('Xin chào');
    expect(pick('en', 'Xin chào', 'Hello')).toBe('Hello');
  });
  it('says how long ago', () => {
    const now = Date.UTC(2026, 10, 26, 12);
    expect(timeAgo(new Date(now - 30_000), 'vi', now)).toBe('vừa xong');
    expect(timeAgo(new Date(now - 3 * 3_600_000), 'vi', now)).toBe('3 giờ trước');
    expect(timeAgo(new Date(now - 2 * 86_400_000), 'en', now)).toBe('2 d ago');
  });
});

describe('Markdown is made safe', () => {
  it('drops scripts, event handlers and javascript: links', async () => {
    const { html } = await renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[x](javascript:alert(1))\n\n<iframe src="https://evil"></iframe>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/<iframe/i);
  });
  it('keeps normal formatting, opens outside links in a new tab, and gives headings ids', async () => {
    const { html, headings } = await renderMarkdown('## Cài đặt\n\n**đậm** [Astro](https://astro.build)');
    expect(html).toContain('<strong>đậm</strong>');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('id="cai-dat"');
    expect(headings).toEqual([{ depth: 2, text: 'Cài đặt', slug: 'cai-dat' }]);
  });
  it('highlights code without letting it run', async () => {
    const { html } = await renderMarkdown('```js\nconst x = "<b>hi</b>";\n```');
    expect(html).toContain('shiki');
    expect(html).not.toContain('<b>hi</b>');
  });
});

describe('spam helpers', () => {
  it('counts links', () => expect(countLinks('a https://x.y b http://z.w c')).toBe(2));
  it('reads the blocked-word list', () => expect(parseWords('Xấu\nquảng cáo, xấu ,\n')).toEqual(['xấu', 'quảng cáo']));
  it('matches whole words without accents or capitals', () => {
    const words = ['quảng cáo', 'xấu'];
    expect(containsBlocked('Mua QUANG CAO giá rẻ', words)).toBe(true);
    expect(containsBlocked('Tool này xấu quá', words)).toBe(true);
    expect(containsBlocked('xấuxí', words)).toBe(false);
    expect(containsBlocked('Tool rất hay', words)).toBe(false);
  });
});

describe('cache date handling', () => {
  it('turns date text back into dates, and leaves real dates alone', async () => {
    const { reviveDates } = await import('@/lib/cache');
    const real = new Date('2026-11-26T10:00:00Z');
    const out = reviveDates({ title: 'x', publishedAt: '2026-11-26T10:00:00.000Z', createdAt: real, tool: { id: 1 }, list: [{ updatedAt: '2026-01-01T00:00:00.000Z' }] });
    expect(out.publishedAt).toBeInstanceOf(Date);
    expect(out.createdAt).toBe(real);
    expect(out.list[0].updatedAt).toBeInstanceOf(Date);
    expect(out.tool).toEqual({ id: 1 });
    expect(out.title).toBe('x');
  });
});
