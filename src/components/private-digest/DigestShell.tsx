import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { localize } from '@/lib/private-digest';

const ownerHref = '/submit-property';
const buyerHref = '/private-interest';

export async function DigestNav() {
  const locale = await getLocale();
  const links = [
    [localize(locale, 'المجموعة الخاصة', 'Private Digest'), '/properties'],
    [localize(locale, 'للملّاك', 'For Owners'), ownerHref],
    [localize(locale, 'للمشترين', 'For Buyers'), buyerHref],
    [localize(locale, 'عن مهاد', 'About'), '/about'],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#ded6c7] bg-[#f7f2e8]/94 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="font-serif text-3xl font-semibold tracking-normal text-[#1e1a14]">
          Mihad
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#625746] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#1e1a14]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href={buyerHref} className="hidden min-h-10 items-center rounded-[8px] border border-[#c9bda8] px-4 text-sm font-semibold text-[#1e1a14] transition hover:bg-white sm:inline-flex">
            {localize(locale, 'اهتمام خاص', 'Private Interest')}
          </Link>
          <Link href={ownerHref} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#1e1a14] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3024]">
            {localize(locale, 'اعرض بهدوء', 'Showcase Quietly')}
          </Link>
        </div>
      </div>
    </header>
  );
}

export async function DigestFooter() {
  const locale = await getLocale();

  return (
    <footer className="border-t border-[#ded6c7] bg-[#efe6d7] pb-16 sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#625746] sm:px-6 md:grid-cols-[1.25fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/home" className="font-serif text-3xl font-semibold text-[#1e1a14]">
            Mihad
          </Link>
          <p className="mt-3 max-w-xl leading-7">
            {localize(
              locale,
              'مهاد مساحة خاصة للمنازل السعودية الاستثنائية. الظهور هادئ، والاهتمام يمر عبر فحص قبل أن يصل للمالك.',
              'Mihad is a private room for exceptional Saudi homes. Visibility stays calm, and interest is screened before an owner is approached.'
            )}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#1e1a14]">{localize(locale, 'المسارات', 'Paths')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/properties">{localize(locale, 'المجموعة الخاصة', 'Private Digest')}</Link>
            <Link href={ownerHref}>{localize(locale, 'تقديم منزل', 'Submit a Property')}</Link>
            <Link href={buyerHref}>{localize(locale, 'اهتمام خاص', 'Private Interest')}</Link>
            <Link href="/about">{localize(locale, 'عن مهاد', 'About Mihad')}</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#1e1a14]">{localize(locale, 'الخصوصية', 'Discretion')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/privacy">{localize(locale, 'الخصوصية', 'Privacy')}</Link>
            <Link href="/terms">{localize(locale, 'الشروط', 'Terms')}</Link>
            <span>{localize(locale, 'لا سعر عام', 'No public price')}</span>
            <span>{localize(locale, 'لا تواصل مباشر مع المالك', 'No direct owner contact')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function DigestMobileNav() {
  const locale = await getLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#ded6c7] bg-[#f7f2e8] text-[11px] font-semibold text-[#625746] shadow-[0_-10px_30px_rgba(30,26,20,0.08)] sm:hidden">
      <Link href="/home" className="grid min-h-14 place-items-center">{localize(locale, 'الرئيسية', 'Home')}</Link>
      <Link href="/properties" className="grid min-h-14 place-items-center">{localize(locale, 'المجموعة', 'Digest')}</Link>
      <Link href={buyerHref} className="grid min-h-14 place-items-center text-[#1e1a14]">{localize(locale, 'اهتمام', 'Interest')}</Link>
      <Link href={ownerHref} className="grid min-h-14 place-items-center">{localize(locale, 'للملّاك', 'Owners')}</Link>
    </div>
  );
}

export async function DigestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1e1a14]">
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
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f45]">{eyebrow}</p> : null}
      <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#1e1a14] md:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-8 text-[#625746]">{body}</p> : null}
    </div>
  );
}
