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

## Cấu trúc

| Đường dẫn | File |
|---|---|
| `/` | `src/pages/index.astro` |
| `/blog` | `src/pages/blog/index.astro` |
| `/blog/<bài>` | `src/layouts/PostLayout.astro` |
| `/the/<thẻ>` | `src/pages/the/[tag].astro` |
| `/ve-toi` | `src/pages/ve-toi.astro` |
| `/rss.xml` | `src/pages/rss.xml.js` |

Màu sắc và kiểu chữ nằm trong `src/styles/global.css`. Tên blog, mô tả và link LinkedIn nằm trong `src/site.ts`.

## Đưa lên mạng

Blog chạy trên GitHub Pages tại https://tranthanhlo.github.io. Mỗi lần đẩy code lên nhánh `main`, GitHub tự build và cập nhật web (xem `.github/workflows/deploy.yml`, tiến trình nằm ở tab Actions của repo).

Khi có tên miền riêng, sửa `site` trong `astro.config.mjs` để RSS và sitemap có đường dẫn đúng.

## Bản 3D cũ

Phòng trưng bày 3D các công trình Đà Nẵng vẫn còn trên nhánh `3d-gallery`:

```bash
git switch 3d-gallery
```
