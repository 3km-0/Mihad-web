import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { localize } from '@/lib/private-digest';

export async function DigestNav() {
  const locale = await getLocale();
  const links = [
    [localize(locale, 'المساحات', 'Spaces'), '/spaces'],
    [localize(locale, 'عن مهاد', 'About'), '/about'],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#D8DEE8] bg-white/94 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="text-xl font-semibold tracking-normal text-[#101827]">
          Mihad
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#334155] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#101827]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/spaces" className="inline-flex min-h-10 items-center rounded-[6px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
            {localize(locale, 'المختارات', 'The Edit')}
          </Link>
        </div>
      </div>
    </header>
  );
}

export async function DigestFooter() {
  const locale = await getLocale();

  return (
    <footer className="border-t border-[#D8DEE8] bg-[#F8FAFC] pb-16 sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#667085] sm:px-6 md:grid-cols-[1.25fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/home" className="text-xl font-semibold text-[#101827]">
            Mihad
          </Link>
          <p className="mt-3 max-w-xl leading-7">
            {localize(
              locale,
              'مهاد مختارات بصرية للفلل، المجالس، الأفنية، والعمارة الداخلية في مزاج سعودي معاصر.',
              'Mihad collects villas, majlis rooms, courtyards, and interiors in a contemporary Saudi mood.'
            )}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#101827]">{localize(locale, 'المختارات', 'Edit')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/spaces">{localize(locale, 'المساحات', 'Spaces')}</Link>
            <Link href="/about">{localize(locale, 'عن مهاد', 'About Mihad')}</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#101827]">{localize(locale, 'روابط', 'Links')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/privacy">{localize(locale, 'الخصوصية', 'Privacy')}</Link>
            <Link href="/terms">{localize(locale, 'الشروط', 'Terms')}</Link>
            <Link href="/support">{localize(locale, 'الدعم', 'Support')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function DigestMobileNav() {
  const locale = await getLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#D8DEE8] bg-white text-[11px] font-semibold text-[#667085] shadow-[0_-10px_30px_rgba(16,24,39,0.06)] sm:hidden">
      <Link href="/home" className="grid min-h-14 place-items-center">{localize(locale, 'الرئيسية', 'Home')}</Link>
      <Link href="/spaces" className="grid min-h-14 place-items-center text-[#101827]">{localize(locale, 'المساحات', 'Spaces')}</Link>
      <Link href="/about" className="grid min-h-14 place-items-center">{localize(locale, 'عن مهاد', 'About')}</Link>
    </div>
  );
}

export async function DigestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#101827]">
      <DigestNav />
      {children}
      <DigestFooter />
      <DigestMobileNav />
    </div>
  );
}

export function DigestSectionHeading({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-[#101827] md:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-8 text-[#334155]">{body}</p> : null}
    </div>
  );
}
