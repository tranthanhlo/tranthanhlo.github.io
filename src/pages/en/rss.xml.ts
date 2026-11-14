import type { APIContext } from 'astro';
import { buildFeed } from '../../rss';

export const GET = (context: APIContext) => buildFeed(context, 'en');
