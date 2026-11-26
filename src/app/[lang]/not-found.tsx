import Link from 'next/link';

// Shown for any address that doesn't exist, in both languages
export default function NotFound() {
  return (
    <div className="pad page py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-faint">404</p>
      <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">Trang này trôi theo dòng sông Hàn mất rồi.</h1>
      <p className="mt-3 text-soft">Có thể đường dẫn bị gõ nhầm, hoặc nội dung đã được đổi tên.</p>
      <Link href="/" className="press mt-2 inline-flex min-h-11 items-center font-medium text-accent">
        Về trang chủ →
      </Link>

      <div lang="en" className="mt-12 border-t border-line pt-8">
        <h2 className="text-xl font-bold text-ink">This page has drifted away down the Han River.</h2>
        <p className="mt-2 text-soft">The link may be mistyped, or the content may have been renamed.</p>
        <Link href="/en" className="press mt-2 inline-flex min-h-11 items-center font-medium text-accent">
          Back to home →
        </Link>
      </div>
    </div>
  );
}
