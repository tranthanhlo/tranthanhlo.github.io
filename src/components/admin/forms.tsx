import { deletePost, deleteTool, deleteVideo, savePost, saveTool, saveVideo } from '@/actions/admin';
import { ConfirmButton } from '@/components/ConfirmButton';
import type { Post, Tool, Video } from '@/lib/queries';
import { ImageField } from './ImageField';
import { MarkdownField } from './MarkdownField';
import { YoutubeField } from './YoutubeField';
import { btnDanger, btnPrimary, Check, Field, inputClass, Notice } from './ui';

const day = (d?: Date | null) => (d ?? new Date()).toISOString().slice(0, 10);

const ERRORS: Record<string, string> = {
  title: 'Cần nhập tiêu đề.',
  name: 'Cần nhập tên.',
  youtube: 'Link YouTube không hợp lệ.',
};

function DeleteForm({ id, action, what }: { id: number; action: (fd: FormData) => Promise<void>; what: string }) {
  return (
    <form action={action} className="mt-8 border-t border-line pt-4">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message={`Xóa ${what} này? Không thể hoàn tác.`} className={btnDanger}>
        Xóa {what}
      </ConfirmButton>
    </form>
  );
}

export function VideoForm({ video, tools, error }: { video?: Video; tools: Tool[]; error?: string }) {
  return (
    <>
      {error && <Notice kind="error">{ERRORS[error] ?? 'Có lỗi.'}</Notice>}
      <form action={saveVideo} className="grid max-w-2xl gap-5">
        {video && <input type="hidden" name="id" value={video.id} />}
        <YoutubeField defaultValue={video?.youtubeId} />
        <Field label="Tiêu đề (tiếng Việt)">
          <input id="title" name="title" defaultValue={video?.title} required className={inputClass} />
        </Field>
        <Field label="Tiêu đề (tiếng Anh, tùy chọn)">
          <input name="titleEn" defaultValue={video?.titleEn ?? ''} className={inputClass} />
        </Field>
        <Field label="Tool liên quan">
          <select name="toolId" defaultValue={video?.toolId ?? ''} className={inputClass}>
            <option value="">(không)</option>
            {tools.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Thời lượng" hint="Ví dụ 4:12">
            <input name="duration" defaultValue={video?.duration ?? ''} className={inputClass} />
          </Field>
          <Field label="Ngày đăng">
            <input type="date" name="publishedAt" defaultValue={day(video?.publishedAt)} className={inputClass} />
          </Field>
        </div>
        <MarkdownField name="description" label="Mô tả (Markdown)" defaultValue={video?.description} rows={6} />
        <MarkdownField name="descriptionEn" label="Mô tả tiếng Anh (tùy chọn)" defaultValue={video?.descriptionEn} rows={4} />
        <ImageField name="thumbnailUrl" label="Ảnh thumbnail (để trống thì lấy từ YouTube)" defaultValue={video?.thumbnailUrl} />
        <Field label="Địa chỉ trang (slug)" hint="Để trống để tự tạo từ tiêu đề.">
          <input name="slug" defaultValue={video?.slug ?? ''} className={inputClass} />
        </Field>
        <Check name="vertical" label="Video dọc (dạng ngắn)" defaultChecked={video?.vertical} />
        <Check name="published" label="Đăng công khai" defaultChecked={video?.published} />
        <button type="submit" className={btnPrimary}>
          Lưu
        </button>
      </form>
      {video && <DeleteForm id={video.id} action={deleteVideo} what="video" />}
    </>
  );
}

export function ToolForm({ tool, error }: { tool?: Tool; error?: string }) {
  return (
    <>
      {error && <Notice kind="error">{ERRORS[error] ?? 'Có lỗi.'}</Notice>}
      <form action={saveTool} className="grid max-w-2xl gap-5">
        {tool && <input type="hidden" name="id" value={tool.id} />}
        <Field label="Tên tool">
          <input name="name" defaultValue={tool?.name} required className={inputClass} />
        </Field>
        <Field label="Tên tiếng Anh (tùy chọn)">
          <input name="nameEn" defaultValue={tool?.nameEn ?? ''} className={inputClass} />
        </Field>
        <Field label="Mô tả ngắn">
          <input name="tagline" defaultValue={tool?.tagline} className={inputClass} />
        </Field>
        <Field label="Mô tả ngắn tiếng Anh (tùy chọn)">
          <input name="taglineEn" defaultValue={tool?.taglineEn ?? ''} className={inputClass} />
        </Field>
        <ImageField name="iconUrl" label="Icon" defaultValue={tool?.iconUrl} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nền tảng" hint="Ví dụ Revit 2024–2026">
            <input name="platform" defaultValue={tool?.platform ?? ''} className={inputClass} />
          </Field>
          <Field label="Trạng thái">
            <select name="status" defaultValue={tool?.status ?? 'dev'} className={inputClass}>
              <option value="dev">Đang phát triển</option>
              <option value="released">Đã phát hành</option>
            </select>
          </Field>
        </div>
        <Field label="Link tải về">
          <input name="downloadUrl" type="url" defaultValue={tool?.downloadUrl ?? ''} placeholder="https://…" className={inputClass} />
        </Field>
        <Field label="Link GitHub">
          <input name="githubUrl" type="url" defaultValue={tool?.githubUrl ?? ''} placeholder="https://…" className={inputClass} />
        </Field>
        <Field label="Link hướng dẫn">
          <input name="docsUrl" type="url" defaultValue={tool?.docsUrl ?? ''} placeholder="https://…" className={inputClass} />
        </Field>
        <MarkdownField name="description" label="Giới thiệu (Markdown)" defaultValue={tool?.description} rows={8} />
        <MarkdownField name="descriptionEn" label="Giới thiệu tiếng Anh (tùy chọn)" defaultValue={tool?.descriptionEn} rows={5} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Thứ tự" hint="Số nhỏ hiện trước.">
            <input name="sortOrder" type="number" defaultValue={tool?.sortOrder ?? 0} className={inputClass} />
          </Field>
          <Field label="Địa chỉ trang (slug)" hint="Để trống để tự tạo.">
            <input name="slug" defaultValue={tool?.slug ?? ''} className={inputClass} />
          </Field>
        </div>
        <Check name="published" label="Đăng công khai" defaultChecked={tool?.published} />
        <button type="submit" className={btnPrimary}>
          Lưu
        </button>
      </form>
      {tool && <DeleteForm id={tool.id} action={deleteTool} what="tool" />}
    </>
  );
}

export function PostForm({ post, error }: { post?: Post; error?: string }) {
  return (
    <>
      {error && <Notice kind="error">{ERRORS[error] ?? 'Có lỗi.'}</Notice>}
      <form action={savePost} className="grid max-w-2xl gap-5">
        {post && <input type="hidden" name="id" value={post.id} />}
        <Field label="Tiêu đề (tiếng Việt)">
          <input name="title" defaultValue={post?.title} required className={inputClass} />
        </Field>
        <Field label="Tiêu đề (tiếng Anh, tùy chọn)">
          <input name="titleEn" defaultValue={post?.titleEn ?? ''} className={inputClass} />
        </Field>
        <Field label="Mô tả ngắn">
          <input name="description" defaultValue={post?.description} className={inputClass} />
        </Field>
        <Field label="Mô tả ngắn tiếng Anh (tùy chọn)">
          <input name="descriptionEn" defaultValue={post?.descriptionEn ?? ''} className={inputClass} />
        </Field>
        <ImageField name="coverUrl" label="Ảnh bìa" defaultValue={post?.coverUrl} />
        <MarkdownField name="body" label="Nội dung (Markdown)" defaultValue={post?.body} rows={16} />
        <MarkdownField name="bodyEn" label="Nội dung tiếng Anh (tùy chọn)" defaultValue={post?.bodyEn} rows={10} />
        <Field label="Thẻ" hint="Cách nhau bằng dấu phẩy.">
          <input name="tags" defaultValue={post?.tags.join(', ') ?? ''} className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ngày đăng">
            <input type="date" name="publishedAt" defaultValue={day(post?.publishedAt)} className={inputClass} />
          </Field>
          <Field label="Địa chỉ trang (slug)" hint="Để trống để tự tạo.">
            <input name="slug" defaultValue={post?.slug ?? ''} className={inputClass} />
          </Field>
        </div>
        <Check name="published" label="Đăng công khai" defaultChecked={post?.published} />
        <button type="submit" className={btnPrimary}>
          Lưu
        </button>
      </form>
      {post && <DeleteForm id={post.id} action={deletePost} what="bài viết" />}
    </>
  );
}
