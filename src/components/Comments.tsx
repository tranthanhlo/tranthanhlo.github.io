'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState, useTransition } from 'react';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { SignInSheet, type SignInText } from './SignInSheet';
import { addComment, deleteComment, editComment, loadComments, toggleCommentLike } from '@/actions/engage';
import type { TargetType } from '@/db/schema';

export interface CommentItem {
  id: number;
  parentId: number | null;
  body: string;
  when: string;
  edited: boolean;
  userId: string;
  userName: string;
  userImage: string | null;
  isAdmin: boolean;
  likes: number;
  liked: boolean;
}

type Strings = SignInText & {
  comments: string;
  noComments: string;
  commentPlaceholder: string;
  send: string;
  reply: string;
  edit: string;
  delete: string;
  cancel: string;
  errTooFast: string;
  errEmpty: string;
  errTooLong: string;
  errBanned: string;
  errGeneric: string;
  loadMoreComments: string;
  sortTop: string;
  sortNew: string;
  like: string;
  liked: string;
};

interface Props {
  type: TargetType;
  id: number;
  items: CommentItem[];
  hasMore: boolean;
  total: number;
  lang: string;
  me: { id: string; isAdmin: boolean } | null;
  dev: boolean;
  s: Strings;
}

// Comments are plain text. Web addresses become links; nothing else is ever treated as HTML.
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s<]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="nofollow ugc noopener noreferrer" className="text-accent underline underline-offset-2">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) return <img src={image} alt="" width={32} height={32} referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full bg-surface" />;
  return (
    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-accent">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function Comments({ type, id, items, hasMore, total, lang, me, dev, s }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [editing, setEditing] = useState<{ id: number; body: string } | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [list, setList] = useState(items);
  const [more, setMore] = useState(hasMore);
  const [sort, setSort] = useState<'top' | 'new'>('top');

  // fresh comments from the server (after posting or deleting): start again from the first page
  useEffect(() => {
    setList(items);
    setMore(hasMore);
    setSort('top');
  }, [items, hasMore]);

  const top = list.filter((c) => c.parentId === null);
  const repliesOf = (cid: number) => list.filter((c) => c.parentId === cid);

  function changeSort(next: 'top' | 'new') {
    if (next === sort) return;
    setSort(next);
    start(async () => {
      const r = await loadComments(type, id, lang, next, 0);
      setList(r.items);
      setMore(r.hasMore);
    });
  }

  function loadMore() {
    start(async () => {
      const r = await loadComments(type, id, lang, sort, top.length);
      setList((old) => [...old, ...r.items.filter((c) => !old.some((o) => o.id === c.id))]);
      setMore(r.hasMore);
    });
  }

  function likeComment(c: CommentItem) {
    if (!me) return setGate(true);
    const flip = (on: boolean, total: number) => setList((old) => old.map((x) => (x.id === c.id ? { ...x, liked: on, likes: total } : x)));
    flip(!c.liked, c.likes + (c.liked ? -1 : 1));
    start(async () => {
      const r = await toggleCommentLike(c.id);
      if (r.ok) flip(r.on, r.total);
      else flip(c.liked, c.likes);
    });
  }
  const first = top[0];

  const message = (code: string) =>
    ({ 'too-fast': s.errTooFast, empty: s.errEmpty, 'too-long': s.errTooLong, banned: s.errBanned })[code] ?? s.errGeneric;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return setGate(true);
    setError('');
    start(async () => {
      const r = editing ? await editComment(editing.id, text) : await addComment(type, id, text, replyTo?.id);
      if (r.ok) {
        setText('');
        setReplyTo(null);
        setEditing(null);
        router.refresh();
      } else setError(message(r.error));
    });
  }

  function remove(cid: number) {
    start(async () => {
      const r = await deleteComment(cid);
      if (r.ok) router.refresh();
      else setError(message(r.error));
    });
  }

  function row(c: CommentItem, reply = false) {
    const mine = me?.id === c.userId;
    return (
      <li key={c.id} className={`flex gap-3 ${reply ? 'ml-11 mt-3' : 'mt-5'}`}>
        <Avatar name={c.userName} image={c.userImage} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-faint">
            <span className="font-semibold text-ink">{c.userName}</span>
            {c.isAdmin && <span className="ml-1.5 rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-accent">★</span>}
            <span> · {c.when}</span>
            {c.edited && <span> · ✎</span>}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{linkify(c.body)}</p>
          <div className="-ml-3 flex items-center">
            <button
              type="button"
              onClick={() => likeComment(c)}
              aria-pressed={c.liked}
              aria-label={c.liked ? s.liked : s.like}
              className="press flex min-h-11 items-center gap-1.5 px-3 text-[13px] text-soft"
            >
              <Icon name="like" size={16} filled={c.liked} />
              {c.likes > 0 && <span>{c.likes}</span>}
            </button>
            {!reply && (
              <button type="button" className="press min-h-11 px-3 text-[13px] font-medium text-soft" onClick={() => (me ? (setEditing(null), setReplyTo(c)) : setGate(true))}>
                {s.reply}
              </button>
            )}
            {mine && (
              <button type="button" className="press min-h-11 px-3 text-[13px] font-medium text-soft" onClick={() => (setReplyTo(null), setEditing({ id: c.id, body: c.body }), setText(c.body))}>
                {s.edit}
              </button>
            )}
            {(mine || me?.isAdmin) && (
              <button type="button" className="press min-h-11 px-3 text-[13px] font-medium text-soft" onClick={() => remove(c.id)}>
                {s.delete}
              </button>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press block w-full rounded-xl bg-surface p-3 text-left"
        aria-label={`${s.comments}: ${total}`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="chat" size={18} />
          {s.comments}
          <span className="font-normal text-faint">{total}</span>
        </span>
        {first ? (
          <span className="mt-2 flex items-center gap-2">
            <Avatar name={first.userName} image={first.userImage} />
            <span className="line-clamp-1 text-sm text-soft">{first.body}</span>
          </span>
        ) : (
          <span className="mt-1 block text-sm text-faint">{s.noComments}</span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`${s.comments} (${total})`} closeLabel={s.close} tall>
        <div className="flex h-full flex-col">
          <div className="flex gap-2 px-4 pt-3" role="group">
            {(['top', 'new'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={sort === k}
                onClick={() => changeSort(k)}
                className={`press min-h-9 rounded-lg px-3 text-sm font-medium ${sort === k ? 'bg-chip text-chip-ink' : 'bg-surface'}`}
              >
                {k === 'top' ? s.sortTop : s.sortNew}
              </button>
            ))}
          </div>
          <ul className="flex-1 overflow-y-auto px-4 pb-4">
            {top.length === 0 && <li className="py-8 text-center text-soft">{s.noComments}</li>}
            {top.map((c) => (
              <Fragment key={c.id}>
                {row(c)}
                {repliesOf(c.id).map((r) => row(r, true))}
              </Fragment>
            ))}
            {more && (
              <li className="mt-4">
                <button type="button" onClick={loadMore} disabled={pending} className="press min-h-11 w-full rounded-full bg-surface text-sm font-semibold disabled:opacity-50">
                  {s.loadMoreComments}
                </button>
              </li>
            )}
          </ul>

          <form onSubmit={submit} className="border-t border-line bg-bg p-3">
            {(replyTo || editing) && (
              <p className="mb-2 flex items-center justify-between text-xs text-faint">
                <span>{editing ? s.edit : `${s.reply} ${replyTo?.userName}`}</span>
                <button type="button" className="press min-h-8 px-2 font-medium" onClick={() => (setReplyTo(null), setEditing(null), setText(''))}>
                  {s.cancel}
                </button>
              </p>
            )}
            {error && (
              <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {me ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={s.commentPlaceholder}
                  aria-label={s.commentPlaceholder}
                  rows={2}
                  maxLength={2000}
                  className="min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-base"
                />
                <button
                  type="submit"
                  disabled={pending || !text.trim()}
                  className="press min-h-11 rounded-full bg-accent px-5 font-semibold text-on-accent disabled:opacity-40"
                >
                  {s.send}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setGate(true)} className="press min-h-11 w-full rounded-full bg-accent px-5 font-semibold text-on-accent">
                {s.signInGoogle}
              </button>
            )}
          </form>
        </div>
      </Sheet>
      <SignInSheet open={gate} onClose={() => setGate(false)} s={s} dev={dev} />
    </>
  );
}
