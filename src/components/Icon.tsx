// Small line icons, drawn to match each other (24px grid, 1.7 stroke)
const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
  tools: 'M14.5 6.5a4 4 0 0 0-5.4 5l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5-5.4l-2.4 2.4-2-.5-.5-2 2.4-2.4Z',
  posts: 'M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h7M9 8h3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  like: 'M7 11v9H4v-9h3Zm0 0 4-7c1.5 0 2.5 1.2 2 2.8L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7',
  save: 'M6 3.5h12v17l-6-4.2-6 4.2v-17Z',
  share: 'M12 4v11M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  chat: 'M4 5.5h16v11H9l-5 4v-15Z',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 21h4',
  download: 'M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  chevron: 'm9 6 6 6-6 6',
  shorts: 'M8 3h8a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm2 6.5v5l4.5-2.5L10 9.5Z',
  plusCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v8M8 12h8',
  volumeOff: 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm12 .5 5 5m0-5-5 5',
  volumeOn: 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11 1a3 3 0 0 1 0 3m2.5-5.5a6.5 6.5 0 0 1 0 8',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24, filled = false, className }: { name: IconName; size?: number; filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
