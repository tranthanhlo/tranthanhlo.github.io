// Interface text and URLs for the two languages. Vietnamese is the default and lives at the site root; English lives under /en/.
export type Lang = 'vi' | 'en';
export const LANGS: Lang[] = ['vi', 'en'];
export const otherLang = (lang: Lang): Lang => (lang === 'vi' ? 'en' : 'vi');

const ui = {
  vi: {
    siteDescription: 'Blog cá nhân của Trần Thanh Lộ: ghi chép, suy nghĩ và những điều nhỏ ở Đà Nẵng.',
    skip: 'Bỏ qua, tới nội dung',
    navMain: 'Chính',
    navPosts: 'Bài viết',
    navAbout: 'Về tôi',
    switchLabel: 'Đọc bằng tiếng Việt',
    themeToggle: 'Chế độ tối',
    footerFrom: 'Viết từ Đà Nẵng',
    homeEyebrow: 'Đà Nẵng · Việt Nam',
    homeHello: 'Xin chào,',
    homeIam: 'tôi là',
    homeName: 'Lộ',
    homeAbout:
      'Tôi viết phần mềm cho ngành xây dựng, ngày ngày làm việc với Revit và ArchiCAD. Đây là góc nhỏ để tôi ghi lại những điều mình nghĩ, mình học và mình đi qua.',
    homeMore: 'Đọc thêm về tôi →',
    latest: 'Bài viết mới',
    allPosts: 'Tất cả bài viết →',
    noPosts: 'Chưa có bài nào. Bài đầu tiên sắp lên.',
    postsTitle: 'Bài viết',
    postsDescription: 'Tất cả bài viết trên blog của Trần Thanh Lộ.',
    postsCount: (n: number) => `${n} bài, mới nhất ở trên cùng.`,
    tagCrumb: 'Thẻ',
    tagDescription: (tag: string) => `Các bài viết có thẻ ${tag}.`,
    tagCount: (n: number) => `${n} bài`,
    draft: 'Bản nháp',
    minRead: (n: number) => `${n} phút đọc`,
    updated: 'cập nhật',
    toc: 'Trong bài này',
    otherPosts: 'Bài khác',
    prev: 'Bài trước',
    next: 'Bài sau',
    copy: 'Sao chép',
    copied: 'Đã chép',
    aboutTitle: 'Về tôi',
    aboutDescription: 'Đôi điều về Trần Thanh Lộ.',
    dateLocale: 'vi-VN',
    ogLocale: 'vi_VN',
  },
  en: {
    siteDescription: 'Personal blog of Trần Thanh Lộ: notes, thoughts and small things from Da Nang.',
    skip: 'Skip to content',
    navMain: 'Main',
    navPosts: 'Writing',
    navAbout: 'About',
    switchLabel: 'Read in English',
    themeToggle: 'Dark mode',
    footerFrom: 'Written in Da Nang',
    homeEyebrow: 'Da Nang · Vietnam',
    homeHello: 'Hello,',
    homeIam: 'I’m',
    homeName: 'Lộ',
    homeAbout:
      'I write software for the construction industry and spend my days with Revit and ArchiCAD. This is a small corner where I keep what I think, learn and live through.',
    homeMore: 'More about me →',
    latest: 'Latest writing',
    allPosts: 'All posts →',
    noPosts: 'No posts in English yet. The first one is on its way.',
    postsTitle: 'Writing',
    postsDescription: 'Everything Trần Thanh Lộ has written in English.',
    postsCount: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}, newest first.`,
    tagCrumb: 'Tag',
    tagDescription: (tag: string) => `Posts tagged ${tag}.`,
    tagCount: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`,
    draft: 'Draft',
    minRead: (n: number) => `${n} min read`,
    updated: 'updated',
    toc: 'In this post',
    otherPosts: 'More posts',
    prev: 'Previous',
    next: 'Next',
    copy: 'Copy',
    copied: 'Copied',
    aboutTitle: 'About',
    aboutDescription: 'A little about Trần Thanh Lộ.',
    dateLocale: 'en-US',
    ogLocale: 'en_US',
  },
} as const;

export const t = (lang: Lang) => ui[lang];

const prefix = (lang: Lang) => (lang === 'vi' ? '' : '/en');

export const paths = (lang: Lang) => ({
  home: lang === 'vi' ? '/' : '/en/',
  blog: `${prefix(lang)}/blog`,
  post: (id: string) => `${prefix(lang)}/blog/${id}`,
  tag: (slug: string) => (lang === 'vi' ? `/the/${slug}` : `/en/tags/${slug}`),
  about: lang === 'vi' ? '/ve-toi' : '/en/about',
  rss: `${prefix(lang)}/rss.xml`,
});

// The same page in the other language. `exact` is false when there is no real translation and we fall back to a list page.
export interface Alternate {
  href: string;
  exact: boolean;
}
