import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { isLang, t } from '@/lib/i18n';
import { getTools, getVideos } from '@/lib/queries';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: t(lang).aboutTitle, alternates: { languages: { vi: '/ve-toi', en: '/en/ve-toi' } } };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  const [tools, videos] = await Promise.all([getTools(), getVideos()]);
  const vi = lang === 'vi';

  return (
    <div className="pad page max-w-2xl py-8">
      <header className="flex items-center gap-4">
        <Logo size={72} />
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{SITE.name}</h1>
          <p className="text-soft">{ui.aboutRole}</p>
          <p className="mt-0.5 text-sm text-faint">Prima Solutions · {vi ? 'Đà Nẵng' : 'Da Nang'}</p>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-2 divide-x divide-line rounded-2xl bg-surface py-3 text-center">
        <div>
          <dt className="text-xs uppercase tracking-wide text-faint">{ui.toolsTitle}</dt>
          <dd className="text-2xl font-semibold">{tools.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-faint">{ui.toolVideos}</dt>
          <dd className="text-2xl font-semibold">{videos.length}</dd>
        </div>
      </dl>

      <div className="prose mt-8">
        {vi ? (
          <>
            <p>
              Tôi sống và làm việc ở Đà Nẵng. Công việc hằng ngày của tôi là viết phần mềm cho ngành xây dựng: plugin và công cụ tự động hóa cho
              Revit và ArchiCAD, bằng C# và C++. Hiện tôi làm BIM/CAD Software Developer tại Prima Solutions, và đang tìm hiểu thêm AutoCAD, Tekla.
            </p>
            <p>Tôi học ở Đại học Bách khoa, Đại học Đà Nẵng.</p>
            {/* TODO: kể thêm về bản thân ngoài công việc: sở thích, điều bạn quan tâm, vì sao lập trang này. */}
            <h2>Trang này</h2>
            <p>Nơi tôi chia sẻ các công cụ mình tạo ra, kèm video demo và bài viết về cách chúng hoạt động.</p>
            <h2>Liên lạc</h2>
            <p>
              Cách nhanh nhất là nhắn cho tôi qua <a href={SITE.linkedin} rel="me noopener noreferrer" target="_blank">LinkedIn</a>.
            </p>
          </>
        ) : (
          <>
            <p>
              I live and work in Da Nang, Vietnam. My day job is writing software for the construction industry: plugins and automation tools for
              Revit and ArchiCAD, in C# and C++. I work as a BIM/CAD Software Developer at Prima Solutions and I’m learning AutoCAD and Tekla on the side.
            </p>
            <p>I studied at the University of Science and Technology – The University of Da Nang.</p>
            {/* TODO: translate whatever you add about yourself on the Vietnamese page. */}
            <h2>This site</h2>
            <p>A place to share the tools I build, with demo videos and posts about how they work.</p>
            <h2>Get in touch</h2>
            <p>
              The quickest way to reach me is a message on <a href={SITE.linkedin} rel="me noopener noreferrer" target="_blank">LinkedIn</a>.
            </p>
          </>
        )}
      </div>

      {/* Dragon Bridge, drawn as one line */}
      <svg viewBox="0 0 320 48" aria-hidden="true" className="mt-10 w-full max-w-xs text-accent">
        <path d="M4 40 H316" stroke="currentColor" strokeWidth="1" opacity="0.35" fill="none" />
        <path
          d="M10 40 c4-6 8-8 12-6 C30 6 52 6 60 40 C68 6 90 6 98 40 C106 6 128 6 136 40 C144 6 166 6 174 40 C182 10 200 6 212 18 c6 6 12 4 16-2 l6-4 l4 3 l-5 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
