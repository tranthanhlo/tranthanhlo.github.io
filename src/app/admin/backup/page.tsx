import { PageHead, btnPrimary } from '@/components/admin/ui';

export default function AdminBackup() {
  return (
    <>
      <PageHead title="Sao lưu" />
      <div className="grid max-w-2xl gap-4 text-[15px]">
        <p>
          Tải về toàn bộ dữ liệu của trang (tool, video, bài viết, thành viên, bình luận, lượt thích, theo dõi) thành một file JSON. Nên tải định kỳ, ví dụ mỗi tháng
          một lần, và cất ở nơi riêng tư vì file có email của thành viên.
        </p>
        <p>
          <a href="/api/admin/backup" className={btnPrimary} download>
            Tải bản sao lưu
          </a>
        </p>
        <p className="text-sm text-faint">
          File không chứa mã đăng nhập Google (không cần, và không nên lưu). Ảnh tải lên nằm ở Vercel Blob, không nằm trong file này. Cách khôi phục có trong README,
          mục “Sao lưu và khôi phục”.
        </p>
      </div>
    </>
  );
}
