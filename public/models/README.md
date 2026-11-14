# Mô hình .glb tự dựng

Thư mục này chứa mô hình 3D thay cho mô hình dựng bằng code.

## Cách thay một mô hình

1. Xuất mô hình ra định dạng **glTF Binary (.glb)**.
   - **Blender:** File → Export → glTF 2.0, chọn Format "glTF Binary (.glb)", bật "Apply Modifiers". Nếu muốn file nhẹ, bật "Draco mesh compression".
   - **Revit:** xuất sang FBX hoặc OBJ, mở bằng Blender rồi xuất .glb. Cách khác là dùng add-in xuất glTF.
   - **SketchUp:** dùng extension xuất glTF, hoặc xuất sang Collada (.dae) rồi chuyển qua Blender.
2. Đặt file vào thư mục này, ví dụ `public/models/rong.glb`.
3. Mở `src/content.js` và thêm `glb` vào công trình tương ứng:

   ```js
   {
     id: 'rong',
     glb: 'models/rong.glb',
     ...
   }
   ```

Web tự co giãn mô hình cho vừa hộp kính và đặt nó lên đế. Bạn không cần chỉnh tỷ lệ hay vị trí lúc xuất. Nếu file lỗi hoặc không tải được, web dùng lại mô hình dựng bằng code.

## Gợi ý để web chạy nhanh

- Giữ mỗi mô hình dưới khoảng 100.000 tam giác và dưới 5 MB.
- Texture nên dùng kích thước 1024 px hoặc 2048 px.
- Trục Y hướng lên trên. Mặt trước của mô hình nên quay về trục +Z.

Mã id của các công trình: `rong` (Cầu Rồng), `nguhanhson` (Ngũ Hành Sơn), `songhan` (Cầu sông Hàn), `cauvang` (Cầu Vàng), `thuanphuoc` (Cầu Thuận Phước), `sunwheel` (Vòng quay Mặt Trời).
