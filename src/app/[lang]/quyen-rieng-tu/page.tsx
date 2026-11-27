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
          <p>Trang này nói rõ những gì được lưu khi bạn dùng trang của Trần Thanh Lộ, theo tinh thần Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Cập nhật lần cuối: 27/11/2026.</p>
          <h2>Khi chỉ xem</h2>
          <p>
            Bạn không cần đăng nhập để xem. Trang không dùng công cụ theo dõi hay quảng cáo. Lựa chọn sáng/tối được nhớ ngay trên máy của bạn. Ảnh xem trước của video được
            tải từ máy chủ ảnh của YouTube (i.ytimg.com) khi trang mở. Khi một thẻ video nằm giữa màn hình, video xem trước sẽ tự phát (tắt tiếng) bằng trình phát youtube-nocookie.com của YouTube; YouTube xử lý dữ liệu theo chính sách của họ. Tính năng này tự tắt khi bạn bật chế độ tiết kiệm dữ liệu hoặc giảm chuyển động, và bạn có thể tắt trong tab Bạn → Cài đặt.
          </p>
          <p>
            Để đếm lượt xem cho đúng (một người xem không thể tự tăng số), trang lưu một <strong>mã băm một chiều</strong> của địa chỉ IP, không lưu chính địa chỉ đó. Mã này
            không thể đổi ngược lại thành địa chỉ và tự xóa sau 1 ngày.
          </p>
          <h2>Khi đăng nhập bằng Google</h2>
          <p>
            Chúng tôi chỉ nhận <strong>tên, email và ảnh đại diện</strong> từ tài khoản Google của bạn. Chúng tôi không nhận mật khẩu và không đọc thư, danh bạ hay
            dữ liệu nào khác của Google. Khi đăng nhập, bạn đồng ý để trang lưu và dùng các dữ liệu nêu trên đúng cho các mục đích ở trang này. Phiên đăng nhập hết hạn
            sau 7 ngày.
          </p>
          <h2>Dữ liệu bạn tạo ra</h2>
          <ul>
            <li>Bình luận (hiển thị công khai cùng tên và ảnh đại diện của bạn).</li>
            <li>Lượt thích và mục đã lưu (chỉ bạn thấy danh sách của mình; số lượt thích hiển thị tổng).</li>
            <li>Mục bạn theo dõi, để gửi email khi có video hoặc tool mới. Mỗi email đều có link hủy theo dõi.</li>
          </ul>
          <h2>Dữ liệu nằm ở đâu</h2>
          <p>
            Trang chạy trên Vercel (máy chủ ở Washington D.C., Hoa Kỳ). Dữ liệu lưu trong cơ sở dữ liệu Postgres do Neon cung cấp (AWS US East 1, Virginia, Hoa Kỳ). Ảnh
            trong bài lưu ở Vercel Blob. Email được gửi qua Resend. Nghĩa là dữ liệu của bạn được lưu và xử lý <strong>ngoài Việt Nam</strong>, bởi các nhà cung cấp trên.
          </p>
          <h2>Giữ trong bao lâu</h2>
          <ul>
            <li>Tài khoản, bình luận, lượt thích, mục đã lưu, mục theo dõi: cho tới khi bạn xóa.</li>
            <li>Mã băm IP để đếm lượt xem và nhật ký chống spam: 1 ngày.</li>
            <li>Bản sao lưu mã hóa của cơ sở dữ liệu: tối đa 90 ngày. Dữ liệu bạn đã xóa có thể còn trong bản sao lưu cũ tới hết thời hạn này rồi mất hẳn.</li>
          </ul>
          <h2>Quyền của bạn</h2>
          <p>
            Bạn có quyền biết, xem, sửa, xóa dữ liệu của mình và rút lại sự đồng ý. Cách làm: tên và ảnh đại diện lấy từ Google nên sửa ở tài khoản Google; bình luận sửa
            hoặc xóa ngay dưới bình luận; theo dõi tắt bằng nút Theo dõi hoặc link trong email. Trong tab <strong>Bạn</strong> có nút <strong>Xóa tài khoản và dữ liệu của
            tôi</strong>, bấm vào là xóa vĩnh viễn tài khoản cùng bình luận, lượt thích, mục đã lưu và mục theo dõi, rồi gửi một email xác nhận tới địa chỉ của bạn.
            Muốn nhận bản sao dữ liệu của mình hoặc có yêu cầu khác, hãy liên hệ bên dưới.
          </p>
          <h2>Liên hệ</h2>
          <p>
            Có câu hỏi, nhắn cho tôi qua <a href={SITE.linkedin} rel="me noopener noreferrer" target="_blank">LinkedIn</a>.
          </p>
        </div>
      ) : (
        <div className="prose">
          <h1 className="text-4xl">Privacy</h1>
          <p>This page explains what is stored when you use Trần Thanh Lộ’s site, in line with Vietnam’s Decree 13/2023/ND-CP on personal data protection. Last updated: 27 November 2026.</p>
          <h2>Just browsing</h2>
          <p>
            You don’t need to sign in to browse. The site uses no tracking tools or ads. Your light/dark choice is remembered on your own device. Video preview pictures are
            loaded from YouTube’s image servers (i.ytimg.com) when a page opens. When a video card is in the middle of the screen, its preview starts playing (muted) with YouTube’s youtube-nocookie.com player, and YouTube handles data under its own policy. This switches itself off with Data Saver or reduced motion, and you can turn it off in You → Settings.
          </p>
          <p>
            To keep view counts honest (one visitor cannot pump them up), the site stores a <strong>one-way hash</strong> of your IP address, never the address itself. The
            hash cannot be turned back into an address and is deleted after one day.
          </p>
          <h2>Signing in with Google</h2>
          <p>
            We only receive your <strong>name, email and profile picture</strong> from your Google account. We never get your password and never read your mail,
            contacts or any other Google data. By signing in you agree that the site stores and uses this data for the purposes on this page. A sign-in lasts 7 days.
          </p>
          <h2>What you create</h2>
          <ul>
            <li>Comments (shown publicly with your name and picture).</li>
            <li>Likes and saved items (only you see your own lists; the like count is shown as a total).</li>
            <li>Items you follow, used to email you about new videos or tools. Every email has an unsubscribe link.</li>
          </ul>
          <h2>Where the data lives</h2>
          <p>
            The site runs on Vercel (servers in Washington D.C., USA). Data is stored in a Postgres database provided by Neon (AWS US East 1, Virginia, USA). Pictures in
            posts are stored in Vercel Blob. Emails are sent through Resend. Your data is therefore stored and processed <strong>outside Vietnam</strong> by these providers.
          </p>
          <h2>How long it is kept</h2>
          <ul>
            <li>Your account, comments, likes, saved items and follows: until you delete them.</li>
            <li>The IP hash used for view counts and the anti-spam log: one day.</li>
            <li>Encrypted database backups: up to 90 days. Data you delete may remain in an older backup until it expires, then it is gone.</li>
          </ul>
          <h2>Your rights</h2>
          <p>
            You may know, see, correct and delete your data, and withdraw your consent. How: your name and picture come from Google, so change them in your Google account;
            edit or delete a comment right under it; stop a follow with the Follow button or the link in any email. In the <strong>You</strong> tab,{' '}
            <strong>Delete my account and data</strong> permanently removes your account with comments, likes, saved items and follows, and sends a confirmation email to
            your address. For a copy of your data or any other request, use the contact below.
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
