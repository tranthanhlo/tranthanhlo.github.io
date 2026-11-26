import { timeAgo, type Lang } from '@/lib/i18n';
import type { CommentView } from '@/lib/queries';

// What the comment list on the page needs (dates already written out in the right language)
export function toCommentItems(list: CommentView[], lang: Lang, now = Date.now()) {
  return list.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    body: c.body,
    when: timeAgo(c.createdAt, lang, now),
    edited: c.edited,
    userId: c.userId,
    userName: c.userName,
    userImage: c.userImage,
    isAdmin: c.isAdmin,
    likes: c.likes,
    liked: c.liked,
  }));
}
