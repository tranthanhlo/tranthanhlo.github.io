import { devLoginEnabled } from '@/lib/admin';
import { getCardStats, type VideoWithTool } from '@/lib/queries';
import { strings, type Lang } from '@/lib/i18n';
import { getSessionUser } from '@/lib/session';
import type { Engage } from '@/components/VideoCard';

// Everything a list of feed cards needs for its small buttons: the numbers, who is signed in, and the texts
export async function loadEngage(videos: VideoWithTool[], lang: Lang): Promise<(video: VideoWithTool) => Engage> {
  const me = await getSessionUser();
  const stats = await getCardStats(videos.map((v) => v.id), me?.id);
  const s = strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close', 'like', 'liked', 'save', 'saved', 'share', 'copiedLink', 'openComments');
  const dev = devLoginEnabled();
  return (v) => ({ stat: stats[v.id], signedIn: !!me, dev, s });
}
