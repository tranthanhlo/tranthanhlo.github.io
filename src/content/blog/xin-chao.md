---
title: Xin chào
description: Bài mẫu để xem bài viết trông như thế nào. Hãy thay bằng bài đầu tiên của bạn.
date: 2026-11-14
tags: [ghi chép]
---

> Đây là **nội dung mẫu**. Bạn có thể sửa thẳng file này thành bài đầu tiên, hoặc xóa đi và tạo bài mới theo hướng dẫn trong `README.md`.

Một bài viết chỉ là một file Markdown. Phần nằm giữa hai dòng `---` ở đầu file ghi tiêu đề, mô tả, ngày đăng và thẻ. Phần còn lại là nội dung.

## Định dạng cơ bản

Chữ **đậm**, chữ *nghiêng*, [đường dẫn](https://astro.build), và danh sách:

- Một ý
- Ý thứ hai
- Ý thứ ba

## Code

Viết code trong ba dấu backtick, kèm tên ngôn ngữ để tô màu:

```csharp
[Transaction(TransactionMode.Manual)]
public class HelloRevit : IExternalCommand
{
    public Result Execute(ExternalCommandData data, ref string message, ElementSet elements)
    {
        TaskDialog.Show("Blog", "Xin chào từ Đà Nẵng!");
        return Result.Succeeded;
    }
}
```

## Ảnh

Đặt ảnh cạnh file bài viết rồi chèn như sau:

```md
![Mô tả ảnh](./ten-anh.jpg)
```

---

Thế là xong. Chúc bạn viết vui.
