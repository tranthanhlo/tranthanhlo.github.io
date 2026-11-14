# Blog của Trần Thanh Lộ

Blog cá nhân dựng bằng [Astro](https://astro.build). Bài viết là các file Markdown.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở http://localhost:4321 để xem. Mỗi lần lưu file, trang tự cập nhật.

## Viết một bài mới

1. Tạo file mới trong `src/content/blog/`. Tên file chính là đường dẫn của bài, nên viết không dấu, nối bằng gạch ngang. Ví dụ `mot-ngay-o-hoi-an.md` sẽ thành `/blog/mot-ngay-o-hoi-an`.
2. Mở đầu file bằng phần thông tin (frontmatter):

   ```md
   ---
   title: Một ngày ở Hội An
   description: Một câu tóm tắt, hiện trong danh sách bài và khi chia sẻ link.
   date: 2026-11-20
   tags: [du lịch, ghi chép]
   draft: true
   ---
   ```

   - `tags` không bắt buộc. Mỗi thẻ có một trang riêng tại `/the/<tên-thẻ>`.
   - `draft: true` nghĩa là bài nháp: vẫn thấy khi chạy `npm run dev` nhưng không có trên web thật. Xóa dòng này khi muốn đăng.
   - `updated: 2026-12-01` (tùy chọn) để ghi ngày sửa bài.
3. Viết nội dung bên dưới bằng Markdown. Tiêu đề phụ dùng `##` và `###`. Bài có từ 3 tiêu đề phụ trở lên sẽ tự có mục lục.

### Thêm ảnh

Nếu bài có ảnh, nên tạo thư mục riêng cho bài:

```
src/content/blog/mot-ngay-o-hoi-an/
  index.md
  pho-co.jpg
```

Trong bài, chèn ảnh bằng `![Phố cổ lúc chiều](./pho-co.jpg)`. Astro tự nén ảnh và tạo nhiều kích thước.

Muốn có ảnh bìa, thêm vào frontmatter:

```md
cover: ./pho-co.jpg
coverAlt: Phố cổ Hội An lúc chiều
```

### Thêm bản tiếng Anh cho một bài

Blog có bản tiếng Anh ở `/en/`. Bên đó chỉ hiện những bài đã có bản dịch.

1. Tạo file **cùng tên** với bài tiếng Việt trong `src/content/en/`. Ví dụ `src/content/blog/mot-ngay-o-hoi-an.md` thì bản dịch là `src/content/en/mot-ngay-o-hoi-an.md`.
2. Frontmatter giống bài tiếng Việt, nhưng `title`, `description` và `tags` viết bằng tiếng Anh.
3. Nút **EN / VI** trên đầu trang sẽ tự chuyển thẳng giữa hai bản của bài. Bài chưa dịch thì nút EN dẫn về danh sách bài tiếng Anh.

Chữ trên giao diện (menu, nút, chân trang…) của cả hai thứ tiếng nằm trong `src/i18n.ts`.

## Cấu trúc

| Đường dẫn | File |
|---|---|
| `/` và `/en/` | `src/views/HomeView.astro` |
| `/blog` và `/en/blog` | `src/views/BlogIndexView.astro` |
| `/blog/<bài>` và `/en/blog/<bài>` | `src/layouts/PostLayout.astro` |
| `/the/<thẻ>` và `/en/tags/<thẻ>` | `src/views/TagView.astro` |
| `/ve-toi` và `/en/about` | `src/views/AboutView.astro` |
| `/rss.xml` và `/en/rss.xml` | `src/rss.ts` |

Các file trong `src/pages/` chỉ gọi tới những file trên, kèm ngôn ngữ. Màu sắc và kiểu chữ nằm trong `src/styles/global.css`. Tên blog và link LinkedIn nằm trong `src/site.ts`.

## Đưa lên mạng

Blog chạy trên GitHub Pages tại https://tranthanhlo.github.io. Mỗi lần đẩy code lên nhánh `main`, GitHub tự build và cập nhật web (xem `.github/workflows/deploy.yml`, tiến trình nằm ở tab Actions của repo).

Khi có tên miền riêng, sửa `site` trong `astro.config.mjs` để RSS và sitemap có đường dẫn đúng.

## Bản 3D cũ

Phòng trưng bày 3D các công trình Đà Nẵng vẫn còn trên nhánh `3d-gallery`:

```bash
git switch 3d-gallery
```
