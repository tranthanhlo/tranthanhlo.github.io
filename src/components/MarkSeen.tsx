'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { markNotificationsSeen } from '@/actions/engage';

// Once the notifications page is open, clear the number on the bell
export function MarkSeen({ unread }: { unread: number }) {
  const router = useRouter();
  useEffect(() => {
    if (unread === 0) return;
    markNotificationsSeen().then(() => router.refresh());
  }, [unread, router]);
  return null;
}
