// Adds sample content (marked as samples) if the database is empty. Safe to run more than once.
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../src/db';

function readPost(file: string) {
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${file}`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].trim() };
}

async function main() {
  const db = await getDb();
  const { tools, videos, posts } = schema;

  const existingTool = await db.select({ id: tools.id }).from(tools).limit(1);
  if (existingTool.length === 0) {
    const inserted = await db
      .insert(tools)
      .values([
        {
          slug: 'tool-mau-revit',
          name: 'Tool mẫu cho Revit',
          nameEn: 'Sample tool for Revit',
          tagline: 'Chỗ này sẽ là mô tả ngắn về tool của bạn.',
          taglineEn: 'A short description of your tool goes here.',
          description: 'Đây là **nội dung mẫu**. Hãy thay bằng tool thật trong trang quản trị.',
          descriptionEn: 'This is **sample content**. Replace it with a real tool in the admin area.',
          platform: 'Revit',
          status: 'released',
          sortOrder: 1,
          published: true,
          isSample: true,
        },
        {
          slug: 'tool-mau-archicad',
          name: 'Tool mẫu cho ArchiCAD',
          nameEn: 'Sample tool for ArchiCAD',
          tagline: 'Một tool mẫu khác, đang phát triển.',
          taglineEn: 'Another sample tool, in development.',
          description: 'Đây là **nội dung mẫu**.',
          descriptionEn: 'This is **sample content**.',
          platform: 'ArchiCAD',
          status: 'dev',
          sortOrder: 2,
          published: true,
          isSample: true,
        },
      ])
      .returning({ id: tools.id, slug: tools.slug });
    const id = (slug: string) => inserted.find((t) => t.slug === slug)!.id;
    const now = Date.now();
    const day = 86_400_000;
    await db.insert(videos).values([
      {
        slug: 'video-mau-1',
        title: 'Video mẫu 1: giới thiệu tool',
        titleEn: 'Sample video 1: tool overview',
        description: 'Nội dung mẫu. Dán link YouTube thật trong trang quản trị để thay video này.',
        descriptionEn: 'Sample content. Paste a real YouTube link in the admin area to replace this video.',
        toolId: id('tool-mau-revit'),
        duration: '4:12',
        publishedAt: new Date(now - 1 * day),
        published: true,
        isSample: true,
      },
      {
        slug: 'video-mau-2',
        title: 'Video mẫu 2: hướng dẫn cài đặt',
        titleEn: 'Sample video 2: installation guide',
        description: 'Nội dung mẫu.',
        descriptionEn: 'Sample content.',
        toolId: id('tool-mau-revit'),
        duration: '2:48',
        publishedAt: new Date(now - 3 * day),
        published: true,
        isSample: true,
      },
      {
        slug: 'video-mau-3',
        title: 'Video mẫu 3: demo nhanh',
        titleEn: 'Sample video 3: quick demo',
        description: 'Nội dung mẫu, video dọc dạng ngắn.',
        descriptionEn: 'Sample content, a short vertical video.',
        toolId: id('tool-mau-archicad'),
        duration: '0:45',
        vertical: true,
        publishedAt: new Date(now - 5 * day),
        published: true,
        isSample: true,
      },
    ]);
    console.log('Seeded 2 sample tools and 3 sample videos');
  }

  const [hasPost] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, 'xin-chao'));
  if (!hasPost) {
    const vi = readPost('seed/xin-chao.vi.md');
    const en = readPost('seed/xin-chao.en.md');
    await db.insert(posts).values({
      slug: 'xin-chao',
      title: vi.meta.title,
      titleEn: en.meta.title,
      description: vi.meta.description,
      descriptionEn: en.meta.description,
      body: vi.body,
      bodyEn: en.body,
      tags: ['ghi chép'],
      publishedAt: new Date(vi.meta.date),
      published: true,
      isSample: true,
    });
    console.log('Seeded the sample post');
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
