import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLang } from '@/lib/i18n';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Quyền riêng tư · Privacy' };

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <div className="pad page max-w-2xl py-8">
      {lang === 'vi' ? (
        <div className="prose">
          <h1 className="text-4xl">Quyền riêng tư</h1>
          <p>Trang này nói rõ những gì được lưu khi bạn dùng trang của Trần Thanh Lộ. Cập nhật lần cuối: 26/11/2026.</p>
          <h2>Khi chỉ xem</h2>
          <p>
            Bạn không cần đăng nhập để xem. Trang không dùng công cụ theo dõi hay quảng cáo. Lựa chọn sáng/tối được nhớ ngay trên máy của bạn. Ảnh xem trước của video được
            tải từ máy chủ ảnh của YouTube (i.ytimg.com) khi trang mở. Khi một thẻ video nằm giữa màn hình, video xem trước sẽ tự phát (tắt tiếng) bằng trình phát youtube-nocookie.com của YouTube; YouTube xử lý dữ liệu theo chính sách của họ. Tính năng này tự tắt khi bạn bật chế độ tiết kiệm dữ liệu hoặc giảm chuyển động, và bạn có thể tắt trong tab Bạn → Cài đặt.
          </p>
          <h2>Khi đăng nhập bằng Google</h2>
          <p>
            Chúng tôi chỉ nhận <strong>tên, email và ảnh đại diện</strong> từ tài khoản Google của bạn. Chúng tôi không nhận mật khẩu và không đọc thư, danh bạ hay
            dữ liệu nào khác của Google.
          </p>
          <h2>Dữ liệu bạn tạo ra</h2>
          <ul>
            <li>Bình luận (hiển thị công khai cùng tên và ảnh đại diện của bạn).</li>
            <li>Lượt thích và mục đã lưu (chỉ bạn thấy danh sách của mình; số lượt thích hiển thị tổng).</li>
            <li>Mục bạn theo dõi, để gửi email khi có video hoặc tool mới. Mỗi email đều có link hủy theo dõi.</li>
          </ul>
          <h2>Dữ liệu nằm ở đâu</h2>
          <p>Trang chạy trên Vercel. Dữ liệu lưu trong cơ sở dữ liệu Postgres do Neon cung cấp. Email thông báo được gửi qua Resend.</p>
          <h2>Quyền của bạn</h2>
          <p>
            Bạn có thể xóa bình luận của mình bất cứ lúc nào. Trong tab <strong>Bạn</strong> có nút <strong>Xóa tài khoản và dữ liệu của tôi</strong>, bấm vào là xóa
            vĩnh viễn tài khoản cùng bình luận, lượt thích, mục đã lưu và mục theo dõi.
          </p>
          <h2>Liên hệ</h2>
          <p>
            Có câu hỏi, nhắn cho tôi qua <a href={SITE.linkedin} rel="me noopener noreferrer" target="_blank">LinkedIn</a>.
          </p>
        </div>
      ) : (
        <div className="prose">
          <h1 className="text-4xl">Privacy</h1>
          <p>This page explains what is stored when you use Trần Thanh Lộ’s site. Last updated: 26 November 2026.</p>
          <h2>Just browsing</h2>
          <p>
            You don’t need to sign in to browse. The site uses no tracking tools or ads. Your light/dark choice is remembered on your own device. Video preview pictures are
            loaded from YouTube’s image servers (i.ytimg.com) when a page opens. When a video card is in the middle of the screen, its preview starts playing (muted) with YouTube’s youtube-nocookie.com player, and YouTube handles data under its own policy. This switches itself off with Data Saver or reduced motion, and you can turn it off in You → Settings.
          </p>
          <h2>Signing in with Google</h2>
          <p>
            We only receive your <strong>name, email and profile picture</strong> from your Google account. We never get your password and never read your mail,
            contacts or any other Google data.
          </p>
          <h2>What you create</h2>
          <ul>
            <li>Comments (shown publicly with your name and picture).</li>
            <li>Likes and saved items (only you see your own lists; the like count is shown as a total).</li>
            <li>Items you follow, used to email you about new videos or tools. Every email has an unsubscribe link.</li>
          </ul>
          <h2>Where the data lives</h2>
          <p>The site runs on Vercel. Data is stored in a Postgres database provided by Neon. Notification emails are sent through Resend.</p>
          <h2>Your choices</h2>
          <p>
            You can delete your comments at any time. In the <strong>You</strong> tab, <strong>Delete my account and data</strong> permanently removes your account with
            comments, likes, saved items and follows.
          </p>
          <h2>Contact</h2>
          <p>
            Questions? Message me on <a href={SITE.linkedin} rel="me noopener noreferrer" target="_blank">LinkedIn</a>.
          </p>
        </div>
      )}
    </div>
  );
}
