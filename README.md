# Trần Thanh Lộ: video, tool và bài viết

Trang giới thiệu các tool của mình, với giao diện kiểu app video trên điện thoại. Có video demo (đăng trên YouTube), bài viết, đăng nhập bằng Google cho người xem (thích, lưu, bình luận, theo dõi) và trang quản trị để tự đăng nội dung.

**Công nghệ:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Postgres (Neon) + Drizzle · Auth.js (Google) · Vercel Blob · Resend. Chạy trên Vercel.

## Chạy trên máy

```bash
npm install
npm run db:migrate   # tạo cơ sở dữ liệu cục bộ trong .data/
npm run db:seed      # nội dung mẫu (không bắt buộc)
npm run dev          # http://localhost:4321
npm test             # kiểm thử tự động (chạy trên cơ sở dữ liệu trong bộ nhớ)
```

Không cần tài khoản nào để chạy trên máy:
- Cơ sở dữ liệu là PGlite (Postgres chạy ngay trong Node), lưu ở `.data/`.
- Trong `.env.local` có `DEV_LOGIN=1`: khi đăng nhập sẽ có thêm hai nút **member** và **admin** để thử mà không cần Google. Nút này **không bao giờ** xuất hiện khi chạy production.
- Ảnh tải lên từ trang admin được lưu ở `public/uploads/`.

Sao chép `.env.example` thành `.env.local` rồi điền (xem bảng bên dưới). Chỉ cần `AUTH_SECRET`, `ADMIN_EMAILS` và `DEV_LOGIN=1` là đủ để thử mọi thứ.

## Đưa lên mạng (Vercel)

Làm một lần, theo thứ tự:

1. **Vercel**: vào vercel.com, đăng nhập bằng GitHub, **Add New → Project**, chọn repo này, bấm **Deploy**. Lần đầu sẽ báo lỗi thiếu `DATABASE_URL`, đó là bình thường, làm tiếp bước 2.
2. **Cơ sở dữ liệu**: trong dự án Vercel, tab **Storage → Create → Neon (Postgres)**. Vercel tự điền `DATABASE_URL`. Bảng được tạo tự động mỗi lần build.
3. **Kho ảnh**: tab **Storage → Create → Blob**. Vercel tự điền `BLOB_READ_WRITE_TOKEN`.
4. **Đăng nhập Google**: vào [console.cloud.google.com](https://console.cloud.google.com), tạo dự án → **APIs & Services → OAuth consent screen** (loại External; điền tên app, email hỗ trợ, link quyền riêng tư là `https://<tên-miền>/quyen-rieng-tu`) → **Credentials → Create credentials → OAuth client ID** (loại Web application). Ở **Authorized redirect URIs** dán:
   `https://<tên-miền>/api/auth/callback/google`
   Lấy **Client ID** và **Client secret**.
5. **Biến môi trường** (Vercel → Settings → Environment Variables):

   | Tên | Giá trị |
   |---|---|
   | `AUTH_SECRET` | một chuỗi ngẫu nhiên, tạo bằng `openssl rand -base64 32` |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | từ bước 4 |
   | `ADMIN_EMAILS` | email Google của bạn (nhiều email thì cách nhau dấu phẩy). Chỉ những email này vào được `/admin` |
   | `SITE_URL` | địa chỉ trang, ví dụ `https://tranthanhlo.vercel.app` (không có dấu `/` cuối) |
   | `RESEND_API_KEY`, `EMAIL_FROM` | chỉ cần khi muốn gửi email thông báo (xem bên dưới) |

   Không đặt `DEV_LOGIN` trên Vercel.
6. **Redeploy** (Deployments → ⋯ → Redeploy). Vào `/admin`, đăng nhập bằng Google, bắt đầu đăng nội dung.

Nội dung mẫu chỉ có ở máy bạn. Trang thật bắt đầu trống cho tới khi bạn thêm tool và video trong `/admin`.

### Thử trên Stage rồi mới lên Production

Có hai môi trường, tách hẳn dữ liệu:

| | Stage | Production |
|---|---|---|
| Nhánh git | `staging` | `main` |
| Địa chỉ | `tranthanhlo-git-staging-ttl18.vercel.app` | `tranthanhlo.vercel.app` |
| Cơ sở dữ liệu | nhánh Neon `preview/staging` (tự tạo, chép từ `main`) | nhánh Neon `main` |

Mỗi lần sửa:

```bash
git switch staging
# sửa code, commit
git push origin staging        # Vercel tự build bản Stage
```

Mở địa chỉ Stage (có dải đỏ **STAGING** ở đầu trang) và thử: đăng nhập, bình luận, đăng bài trong `/admin`. Migration cũng chạy trên cơ sở dữ liệu Stage trước. Ổn rồi mới đưa lên thật:

```bash
gh pr create --base main --head staging --fill
# CI xanh thì gộp (Merge) Pull Request, Vercel tự đưa lên Production
```

Stage bị chặn công cụ tìm kiếm (`robots.txt` và `noindex`). Nhánh DB của Stage do tích hợp Neon tạo tự động (Vercel → Storage → Neon → *Create Database Branch For Deployment: Preview*), mỗi lần build `staging` tự điền `DATABASE_URL` của nhánh đó, nên thử ghi/xóa thoải mái. Các biến khác của Stage (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`, `SITE_URL`) đặt ở Vercel → Settings → Environment Variables, môi trường **Preview**. Địa chỉ Stage phải có trong **Authorized redirect URIs** của Google (`/api/auth/callback/google`) thì mới đăng nhập được trên Stage.

### Email thông báo (Theo dõi)

Khi có video hoặc tool mới, vào `/admin/notify` bấm **Gửi thông báo** (gửi bằng tay, mỗi mục một lần). Để gửi được cho người khác, [Resend](https://resend.com) bắt buộc bạn phải có **tên miền riêng đã xác minh**; khi chưa có, Resend chỉ gửi được về chính email của bạn. `EMAIL_FROM` có dạng `Trần Thanh Lộ <thongbao@ten-mien-cua-ban.com>`.

## Thêm nội dung

Tất cả làm trong **`/admin`** (dùng được trên điện thoại):

- **Video**: dán link YouTube, bấm *Lấy thông tin* để tự điền tiêu đề và ảnh, chọn tool, bấm Lưu. Để Unlisted trên YouTube nếu không muốn video lên kênh công khai.
- **Tool**: tên, mô tả ngắn, icon, nền tảng, link tải/GitHub/hướng dẫn, thứ tự hiển thị.
- **Bài viết**: viết bằng Markdown, có xem trước, chèn ảnh ngay trong khung soạn.
- Mỗi mục có ô **tiếng Anh** tùy chọn. Để trống thì bản `/en/` dùng chữ tiếng Việt.
- **Nháp**: bỏ tick *Đăng công khai* thì mục chỉ thấy trong admin.
- **Bình luận**: ẩn, xóa, chặn người dùng ở `/admin/comments`. Ở đó cũng có ô **Từ cấm**: bình luận chứa từ cấm sẽ tự ẩn chờ bạn duyệt.
- **Tool**: kéo biểu tượng ⠿ (hoặc bấm ↑ ↓) để đổi thứ tự rồi bấm *Lưu thứ tự*.
- **Sao lưu**: `/admin/backup`, xem mục “Sao lưu và khôi phục” bên dưới.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `/`, `/en` | Trang chủ: chip lọc, danh sách video, kệ bài viết và video ngắn |
| `/video/<slug>` | Trình phát, thích/lưu/chia sẻ, theo dõi tool, bình luận, video liên quan |
| `/tool`, `/tool/<slug>` | Danh sách tool, trang của từng tool |
| `/blog`, `/blog/<slug>` | Bài viết |
| `/ve-toi`, `/tim-kiem`, `/ban`, `/quyen-rieng-tu` | Về tôi, tìm kiếm, tài khoản người xem, quyền riêng tư |
| `/thong-bao` | Thông báo video và tool mới của mục bạn theo dõi (chuông) |
| `/admin/*` | Quản trị (chỉ email trong `ADMIN_EMAILS`) |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | RSS, sitemap, robots |

Tiếng Việt nằm ở gốc (`/blog`), tiếng Anh dưới `/en` (`/en/blog`). Cả hai dùng chung một bộ trang trong `src/app/[lang]`; `src/middleware.ts` viết lại địa chỉ và chặn `/admin`.

```
src/app/[lang]/   trang công khai (cả hai ngôn ngữ)
src/app/admin/    trang quản trị
src/actions/      thao tác ghi (thích, bình luận, theo dõi, admin); mỗi thao tác tự kiểm tra quyền
src/db/           bảng dữ liệu (schema.ts) và kết nối
drizzle/          các file migration SQL
src/lib/i18n.ts   chữ giao diện VI/EN
src/lib/markdown.ts  Markdown → HTML an toàn, tô màu code
scripts/          migrate.ts, seed.ts
```

Đổi cấu trúc bảng: sửa `src/db/schema.ts`, chạy `npm run db:generate`, commit file mới trong `drizzle/`. Migration tự chạy ở mỗi lần build.

## Sao lưu và khôi phục

- **Tự động mỗi tuần** (`.github/workflows/backup.yml`, sáng thứ Hai, hoặc bấm *Run workflow* ở tab Actions): `pg_dump` toàn bộ DB Production, **thử khôi phục** vào một Postgres tạm và so số hàng, rồi mã hóa AES-256 và lưu thành artifact 90 ngày. Repo công khai nên file luôn được mã hóa trước khi rời máy chạy. Cần 2 secret ở GitHub → Settings → Secrets and variables → Actions:
  - `BACKUP_DATABASE_URL`: chuỗi kết nối chủ sở hữu (Neon → Connect, role `neondb_owner`).
  - `BACKUP_PASSPHRASE`: mật khẩu dài do bạn đặt. **Cất kỹ, mất là không mở được backup.**

  Khôi phục từ file đó:
  ```bash
  gpg --decrypt tranthanhlo-db-2026-12-01.dump.gpg > backup.dump        # hỏi BACKUP_PASSPHRASE
  pg_restore --no-owner --no-acl --dbname "<chuỗi kết nối DB trống>" backup.dump
  ```
  Sau đó cấp lại quyền cho `app_rw` (câu SQL ở mục Bảo mật) nếu khôi phục sang DB mới.
- **Tải bản sao lưu**: vào `/admin/backup` bấm *Tải bản sao lưu*, nên làm mỗi tháng một lần. File JSON có email thành viên nên cất riêng tư, **không** đưa lên GitHub. File không chứa mã đăng nhập Google. Ảnh tải lên nằm ở Vercel Blob, không nằm trong file.
- **Khôi phục vào cơ sở dữ liệu trống** (ví dụ tạo lại Neon):
  ```bash
  DATABASE_URL="<chuỗi kết nối mới>" npm run db:migrate
  DATABASE_URL="<chuỗi kết nối mới>" npx tsx scripts/restore.ts duong-dan/backup.json
  ```
  Script từ chối chạy nếu cơ sở dữ liệu đã có người dùng.
- **Neon cũng giữ lịch sử**: ở gói miễn phí có thể quay lại trạng thái vài giờ hoặc vài ngày trước ngay trong bảng điều khiển Neon (mục *Restore*). Đó là lưới an toàn thứ hai, ngắn hạn.

## Kiểm thử

`npm test` chạy Vitest: các hàm thuần (đọc link YouTube, lọc Markdown, chữ không dấu…) và các thao tác ghi (thích, bình luận, theo dõi, chuông, admin) trên một Postgres thật trong bộ nhớ (PGlite) với người dùng giả lập. Có các trường hợp: khách, thành viên, người bị chặn, admin, sửa/xóa bình luận của người khác, giới hạn tần suất. GitHub Actions (`.github/workflows/ci.yml`) chạy lint, kiểm tra kiểu, test và build mỗi lần đẩy code.

## Chống spam

- Mỗi người: tối đa 60 lượt thích/lưu/theo dõi mỗi phút, 10 bình luận mỗi 10 phút, cách nhau ít nhất 20 giây, tối đa 2 link trong một bình luận.
- Bình luận chứa từ cấm tự ẩn chờ duyệt.
- Giới hạn được lưu trong cơ sở dữ liệu (bảng `rate_events`) nên chạy đúng trên Vercel.

## Tốc độ

Danh sách và trang chi tiết công khai (video, tool, bài) được lưu tạm tối đa 60 giây (`src/lib/cache.ts`). Mọi thay đổi trong `/admin` xóa bộ nhớ đệm ngay nên không phải đợi. Phần riêng của từng người (đã thích, đã lưu, chuông) luôn lấy mới. Khi thêm thao tác ghi mới cho nội dung công khai, gọi `contentChanged()`.

## Bảo mật

Đã đối chiếu với checklist "安全なウェブサイトの作り方" của IPA (bản 7). Kết quả trong `Kiem-tra-bao-mat-IPA.xlsx`.

**Trong code**
- Quyền admin chỉ dựa vào email trong biến môi trường, được kiểm tra ở middleware, ở layout `/admin` và **ở đầu mỗi thao tác ghi** (đừng bỏ dòng `requireAdmin()` khi thêm thao tác mới). Mỗi thao tác admin ghi một dòng vào bảng `admin_events` (gọi `logAdmin()`); 30 dòng mới nhất hiện ở `/admin`.
- Thao tác của người xem (`src/actions/engage.ts`) luôn lọc theo `userId` của người đang đăng nhập, nên không ai sửa/xóa được bình luận của người khác.
- Bình luận lưu và hiển thị dạng chữ thường (không HTML). Markdown của bài viết được lọc bằng `sanitize-html`.
- Tải ảnh: chỉ admin, tối đa 5MB, kiểm tra loại ảnh bằng nội dung file; thông tin ẩn (GPS, máy ảnh) bị xóa trước khi lưu (`src/lib/strip-metadata.ts`), chỉ giữ hướng xoay.
- Header (`src/lib/security.ts`): `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, và Content-Security-Policy có nonce mới mỗi lần tải trang (tạo trong `src/middleware.ts`). Thêm `<script>` tự viết thì phải gắn `nonce` (xem `src/app/[lang]/layout.tsx`), nếu không trình duyệt sẽ chặn. Nhúng dịch vụ mới (iframe, ảnh, API) thì thêm tên miền vào `buildCsp()`.
- Phiên đăng nhập hết hạn sau 7 ngày.
- Lượt xem: mỗi người xem tính một lần mỗi giờ cho mỗi mục, tối đa 120 lượt/giờ; chỉ lưu bản băm một chiều của địa chỉ IP, xóa sau 1 ngày (bảng `view_events`).
- Lỗi máy chủ: ghi log, và nếu đã cấu hình Resend thì gửi email cho admin (tối đa 1 email/10 phút, `src/instrumentation.ts`). Xóa tài khoản cũng gửi email báo cho chủ tài khoản.

**Ngoài code (cài đặt)**
- **Xác minh 2 bước** cho Google (tài khoản admin), GitHub, Vercel, Neon, Resend. Chiếm được một trong số này là chiếm được trang.
- **Tài khoản DB cho trang**: khi có biến `APP_DATABASE_URL`, trang dùng role `app_rw`: đọc/ghi được dữ liệu nhưng **không xóa hay sửa được bảng** (bảng thuộc `neondb_owner`) và không tạo được bảng mới. `DATABASE_URL` (chủ sở hữu) chỉ dùng khi build để chạy migration. Lưu ý: role tạo trên Neon console luôn thuộc nhóm `neon_superuser` (nên vẫn có quyền tạo role/database) và Neon không cho gỡ (`REVOKE` báo *permission denied*). Muốn role hẹp hơn nữa thì tạo bằng SQL (`CREATE ROLE ... LOGIN PASSWORD '...'`, không qua console) rồi cấp quyền như dưới. Quyền đã cấp cho `app_rw` (chạy bằng `neondb_owner` trong Neon → SQL Editor, nhánh `main`):
  ```sql
  GRANT USAGE ON SCHEMA public TO app_rw;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rw;
  ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
  ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
  ```
- **GitHub**: nhánh `main` chỉ nhận Pull Request có CI xanh; bật Secret scanning, Push protection, Dependabot (`.github/dependabot.yml`). CI chạy `npm audit` cho thư viện chạy thật.
- **Vercel**: bản Stage có Vercel Authentication, người lạ không mở được. Khi bị tấn công dồn dập: Vercel → Firewall → bật **Attack Challenge Mode**.
- **Lộ khóa** (lỡ dán vào chat, ảnh chụp, commit): tạo khóa mới ngay ở nơi cấp (Google Cloud, Neon *Reset password*, Vercel Blob, Resend), dán vào Vercel rồi Redeploy. Đổi `AUTH_SECRET` sẽ đăng xuất mọi người.
- Khi có tên miền riêng: khóa chuyển tên miền và bật 2 bước ở nơi mua; đặt SPF, DKIM, DMARC cho email gửi qua Resend.

## Chuyển blog cũ (tranthanhlo.github.io)

Sau khi trang mới chạy ổn trên Vercel, đổi địa chỉ cũ thành trang chuyển hướng, giữ nguyên đường dẫn (`/blog/xin-chao` → `<địa chỉ mới>/blog/xin-chao`):

```bash
node scripts/make-redirect.mjs https://dia-chi-moi.com redirect-site
git switch --orphan gh-pages
cp -r redirect-site/. . && rm -rf redirect-site
git add -A && git commit -m "Redirect to the new site" && git push origin gh-pages
git switch main
```

Rồi vào GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / root**. Nhánh `main` giờ chứa trang Next.js nên không còn dùng cho GitHub Pages.

## Các phiên bản cũ

Có hai nhánh lưu lại các phiên bản trước của trang này:

```bash
git switch astro-blog    # blog Astro song ngữ (đã chạy tại tranthanhlo.github.io)
git switch 3d-gallery    # phòng trưng bày 3D các công trình Đà Nẵng
```
