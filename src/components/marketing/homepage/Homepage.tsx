'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { trackMarketingEvent } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
type Content = {
  brand: { name: string; tagline: string; theme: string };
  nav: {
    links: Array<{ label: string; href: string }>;
    actions: {
      languageToggle: { left: string; right: string };
      a11y: {
        switchToArabic: string;
        switchToEnglish: string;
        openMenu: string;
        closeMenu: string;
      };
      login: { label: string; href: string };
      primaryCta: { label: string; href: string };
    };
  };
  hero: {
    headline: string;
    subhead: string;
    ctas: Array<{ type: string; label: string; href?: string; action?: string }>;
    proofLine: string;
    mock: { title: string; panels: string[] };
  };
  credibilityStrip: { label: string; items: string[] };
  partners: {
    title: string;
    subhead: string;
    items: Array<{
      id: string;
      label: string;
      href: string;
      logoSrc: string;
      logoAlt: string;
      logoWidth: number;
      logoHeight: number;
    }>;
  };
  problem: {
    title: string;
    body: string[];
    sideCard: { title: string; before: string[]; after: string[] };
  };
  howItWorks: {
    title: string;
    subhead: string;
    steps: Array<{ title: string; body: string }>;
    ctas: Array<{ type: string; label: string; href: string }>;
  };
  stats: { items: Array<{ value: string; label: string }>; footnote: string };
  capabilities: {
    title: string;
    tabs: Array<{ id: string; label: string; title: string; bullets: string[] }>;
  };
  applications: {
    title: string;
    subhead?: string;
    cards: Array<{
      id: string;
      title: string;
      subtitle: string;
      bullets: string[];
      cta: { label: string; href: string };
    }>;
  };
  decisionPack: { id: string; title: string; bullets: string[]; exportButtons: string[] };
  security: {
    id: string;
    title: string;
    leftBullets: string[];
    rightCard: { title: string; bullets: string[] };
  };
  pricing: {
    id: string;
    title: string;
    toggleLabels: string[];
    professional: Array<{
      id: string;
      name: string;
      price: string;
      bullets: string[];
      cta: { label: string; href: string };
    }>;
    enterprise: Array<{
      id: string;
      name: string;
      price: string;
      bullets: string[];
      cta: { label: string; href: string };
    }>;
    usageMeter: { title: string; body: string };
  };
  insights: {
    id: string;
    title: string;
    subhead: string;
    items: Array<{
      id: string;
      tag: string;
      title: string;
      excerpt: string;
      date: string;
      readTime: string;
      href: string;
    }>;
    cta: { label: string; href: string };
  };
  faq: {
    title: string;
    intro: string;
    items: Array<{ id: string; q: string; a: string }>;
    contactRow: {
      note: string;
      ctas: Array<{ type: string; label: string; href: string }>;
    };
  };
  finalCta: {
    title: string;
    subhead: string;
    ctas: Array<{ type: string; label: string; href: string }>;
  };
  footer: {
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
    legalNote: string;
  };
  ui: {
    mentalModelLine: string;
    beforeLabel: string;
    afterLabel: string;
    modal: {
      openDemoLabel: string;
      demoTitle: string;
      demoPlaceholderBody: string;
      demoShowsLabel: string;
      demoShowsBody: string;
      close: string;
    };
    mock: {
      decisionPackLabel: string;
      samplePackTitle: string;
      provisional: string;
      finalized: string;
      verifiedStatus: string;
      reviewStatus: string;
      sampleGoverningLawLabel: string;
      sampleGoverningLawValue: string;
      samplePartyALabel: string;
      samplePartyAValue: string;
      sampleEffectiveDateLabel: string;
      sampleEffectiveDateValue: string;
      sampleTermLabel: string;
      sampleTermMonthsValue: string;
      documentViewer: string;
      verifiedVariables: string;
      exports: string;
      showEvidence: string;
      hideEvidence: string;
      evidence: string;
      pageLabel: string;
      highlightSnippet: string;
      verificationObjectFilename: string;
      uiMockLabel: string;
      exceptionsQueueTitle: string;
      exceptionsQueueBody: string;
      fieldEvidenceLabel: string;
      claimKey: string;
      statusKey: string;
      confidenceKey: string;
      citationsKey: string;
    };
    decisionPackPreview: {
      deliverablesLabel: string;
      deliverables: string[];
      deliverablesBody: string;
    };
    security: {
      buyersCareTitle: string;
    };
    finalCta: {
      previewLabel: string;
    };
  };
};

function useMarketingHomeContent(): Content {
  const t = useTranslations('marketingHome');
  return t.raw('content') as Content;
}

function splitProofLine(line: string) {
  return line
    .split('•')
    .map((item) => item.trim())
    .filter(Boolean);
}

function trackPrimaryCtaClick(location: string, href: string) {
  if (href.startsWith('/support')) {
    trackMarketingEvent('contact_click', { location });
    return;
  }

  trackMarketingEvent('cta_start_free_click', { location });
}

function useScrolled(thresholdPx = 12) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > thresholdPx);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  return isScrolled;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function useInViewOnce<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isInView) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15, ...(options ?? {}) }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [isInView, options]);

  return { ref, isInView };
}

function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-[72px] py-16 sm:py-20 lg:py-28',
        className
      )}
    >
      {children}
    </section>
  );
}

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, isInView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className
      )}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

function PrimaryLinkButton({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--rSm)]',
        'bg-accent text-[color:var(--accent-text)] font-semibold px-5 py-2.5',
        'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'shadow-[0_10px_28px_rgba(29,78,137,0.14)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2',
        className
      )}
    >
      {children}
    </Link>
  );
}

function LanguageToggle({
  leftLabel,
  rightLabel,
  ariaSwitchToArabic,
  ariaSwitchToEnglish,
}: {
  leftLabel: string;
  rightLabel: string;
  ariaSwitchToArabic: string;
  ariaSwitchToEnglish: string;
}) {
  const locale = useLocale();
  const isEn = locale === 'en';

  const onToggle = () => {
    const newLocale = isEn ? 'ar' : 'en';
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    document.cookie = `LOCALE_EXPLICIT=1; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'min-h-[44px] px-3 rounded-[var(--rSm)]',
        'border border-border bg-transparent text-text',
        'transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:border-highlight hover:text-highlight',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
      )}
      aria-label={isEn ? ariaSwitchToArabic : ariaSwitchToEnglish}
    >
      <span className="text-xs tracking-[0.10em] uppercase">
        {leftLabel} <span className="text-text-soft">|</span> {rightLabel}
      </span>
    </button>
  );
}

function PartnerLogoStrip({
  title,
  subhead,
  items,
}: {
  title: string;
  subhead: string;
  items: Array<{
    id: string;
    label: string;
    href: string;
    logoSrc: string;
    logoAlt: string;
    logoWidth: number;
    logoHeight: number;
  }>;
}) {
  return (
    <div className="rounded-[32px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-5 py-6 shadow-[var(--shadowSm)] sm:px-6 sm:py-7">
      <div className="max-w-[42rem]">
        <div className="text-[11px] tracking-[0.18em] uppercase text-text-soft">{title}</div>
        <p className="mt-3 text-sm leading-7 text-text-soft sm:text-base">{subhead}</p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={item.label}
            className="flex min-h-[110px] items-center justify-center rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-white px-6 py-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2"
          >
            <Image
              src={item.logoSrc}
              alt={item.logoAlt}
              width={item.logoWidth}
              height={item.logoHeight}
              className="max-h-14 w-auto max-w-full object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function Card({
  brandLabel,
  title,
  subtitle,
  bullets,
  footer,
  onClick,
}: {
  brandLabel: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  footer?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-[22px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-6 shadow-[var(--shadowSm)]',
        onClick &&
          'cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-accent'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="text-xs tracking-[0.10em] uppercase text-text-soft">{brandLabel}</div>
      <h3 className="mt-2 text-lg font-[family:var(--font-instrument-serif)] font-semibold text-text">
        {title}
      </h3>
      {subtitle ? <p className="mt-2 text-text-soft">{subtitle}</p> : null}
      <ul className="mt-4 space-y-2 text-sm text-text-soft">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-[2px] text-accent">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-auto pt-5">{footer}</div> : null}
    </div>
  );
}

function PillTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'min-h-[44px] px-4 rounded-[var(--rPill)] border text-sm font-semibold',
              'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2',
              isActive
                ? 'bg-accent text-background border-accent'
                : 'bg-transparent text-text border-border hover:border-highlight hover:text-highlight'
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Accordion({
  items,
  onOpen,
}: {
  items: Array<{ id: string; q: string; a: string }>;
  onOpen?: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-[color:var(--border)] rounded-[var(--rMd)] border border-border bg-surface shadow-[var(--shadowSm)]">
      {items.map((item) => {
        const isOpen = item.id === openId;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-button-${item.id}`;
        return (
          <div key={item.id}>
            <button
              id={buttonId}
              className={cn(
                'w-full text-left px-5 py-4 flex items-center justify-between gap-4',
                'transition-colors duration-200 hover:bg-surface-alt',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-[-2px]'
              )}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                setOpenId((prev) => {
                  const next = prev === item.id ? null : item.id;
                  if (next && next !== prev) onOpen?.(next);
                  return next;
                });
              }}
            >
              <span className="font-semibold text-text">{item.q}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'text-text-soft transition-transform duration-200',
                  isOpen ? 'rotate-45' : 'rotate-0'
                )}
              >
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-text-soft">{item.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Nav({ content }: { content: Content }) {
  const isScrolled = useScrolled(12);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const tNav = useTranslations('nav');
  const tSidebar = useTranslations('sidebar');

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const bg = isScrolled ? 'var(--nav-bg-scrolled)' : 'var(--nav-bg-top)';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: bg, borderBottom: '1px solid var(--nav-border)' }}
    >
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-[72px] h-[78px] flex items-center justify-between font-[family:var(--font-plus-jakarta)]">
        <Link
          href="/home"
          className={cn(
            'text-2xl sm:text-3xl font-[family:var(--font-instrument-serif)] font-semibold tracking-tight leading-none text-text',
            'hover:text-accent transition-colors duration-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
          )}
        >
          {content.brand.name}
        </Link>

        <div className="hidden md:block" aria-hidden="true" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageToggle
              leftLabel={content.nav.actions.languageToggle.left}
              rightLabel={content.nav.actions.languageToggle.right}
              ariaSwitchToArabic={content.nav.actions.a11y.switchToArabic}
              ariaSwitchToEnglish={content.nav.actions.a11y.switchToEnglish}
            />
          </div>

          {user ? (
            <>
              <Link
                href="/workspaces"
                className={cn(
                  'hidden sm:inline-flex min-h-[44px] items-center justify-center rounded-[var(--rSm)] px-3',
                  'text-text-soft transition-colors duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-text',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                )}
              >
                {tNav('dashboard')}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className={cn(
                  'hidden sm:inline-flex min-h-[44px] items-center justify-center rounded-[var(--rSm)] px-3',
                  'text-text-soft transition-colors duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-text',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                )}
              >
                {tSidebar('logOut')}
              </button>
            </>
          ) : (
            <>
              <Link
                href={content.nav.actions.login.href}
                className={cn(
                  'hidden sm:inline-flex min-h-[44px] items-center justify-center rounded-[var(--rSm)] px-3',
                  'text-text-soft transition-colors duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-text',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                )}
              >
                {content.nav.actions.login.label}
              </Link>

              <div className="hidden sm:block">
                <PrimaryLinkButton
                  href={content.nav.actions.primaryCta.href}
                  onClick={() => trackMarketingEvent('cta_start_free_click', { location: 'nav' })}
                >
                  {content.nav.actions.primaryCta.label}
                </PrimaryLinkButton>
              </div>
            </>
          )}

          <button
            className={cn(
              'md:hidden min-h-[44px] min-w-[44px] rounded-[var(--rSm)] border border-border bg-transparent',
              'text-text-soft hover:text-text hover:border-highlight transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
            )}
            aria-label={content.nav.actions.a11y.openMenu}
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden border-t border-[color:var(--nav-border)]">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <LanguageToggle
                leftLabel={content.nav.actions.languageToggle.left}
                rightLabel={content.nav.actions.languageToggle.right}
                ariaSwitchToArabic={content.nav.actions.a11y.switchToArabic}
                ariaSwitchToEnglish={content.nav.actions.a11y.switchToEnglish}
              />
              <button
                className={cn(
                  'min-h-[44px] min-w-[44px] rounded-[var(--rSm)] border border-border bg-transparent',
                  'text-text-soft hover:text-text hover:border-highlight transition-colors duration-200',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                )}
                aria-label={content.nav.actions.a11y.closeMenu}
                onClick={() => setMobileOpen(false)}
              >
                ✕
              </button>
            </div>
            {user ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <Link
                  href="/workspaces"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'min-h-[44px] rounded-[var(--rSm)] border border-border bg-transparent px-4 py-3 text-center font-semibold text-text',
                    'hover:border-highlight hover:text-highlight transition-colors duration-200',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                  )}
                >
                  {tNav('dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className={cn(
                    'min-h-[44px] rounded-[var(--rSm)] border border-border bg-transparent px-4 py-3 text-center font-semibold text-text',
                    'hover:border-highlight hover:text-highlight transition-colors duration-200',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                  )}
                >
                  {tSidebar('logOut')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <Link
                  href={content.nav.actions.login.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'min-h-[44px] rounded-[var(--rSm)] border border-border bg-transparent px-4 py-3 text-center font-semibold text-text',
                    'hover:border-highlight hover:text-highlight transition-colors duration-200',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2'
                  )}
                >
                  {content.nav.actions.login.label}
                </Link>
                <PrimaryLinkButton
                  href={content.nav.actions.primaryCta.href}
                  onClick={() => {
                    trackMarketingEvent('cta_start_free_click', { location: 'nav_mobile' });
                    setMobileOpen(false);
                  }}
                  className="w-full"
                >
                  {content.nav.actions.primaryCta.label}
                </PrimaryLinkButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DecisionPackMock() {
  const content = useMarketingHomeContent();
  const pageLabel = (page: number) =>
    content.ui.mock.pageLabel.replace('{page}', String(page));

  const factRows = [
    {
      label: content.ui.mock.sampleGoverningLawLabel,
      value: content.ui.mock.sampleGoverningLawValue,
      status: content.ui.mock.verifiedStatus,
      accent: 'success',
    },
    {
      label: content.ui.mock.samplePartyALabel,
      value: content.ui.mock.samplePartyAValue,
      status: content.ui.mock.verifiedStatus,
      accent: 'success',
    },
    {
      label: content.ui.mock.sampleEffectiveDateLabel,
      value: content.ui.mock.sampleEffectiveDateValue,
      status: content.ui.mock.reviewStatus,
      accent: 'highlight',
    },
    {
      label: content.ui.mock.sampleTermLabel,
      value: content.ui.mock.sampleTermMonthsValue,
      status: content.ui.mock.verifiedStatus,
      accent: 'success',
    },
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(166,227,184,0),rgba(166,227,184,0.35),rgba(166,227,184,0))]" />
      <div className="absolute -right-20 top-10 h-40 w-40 rounded-full bg-[rgba(166,227,184,0.12)] blur-3xl" />
      <div className="absolute -left-12 bottom-12 h-32 w-32 rounded-full bg-[rgba(166,227,184,0.14)] blur-3xl" />

      <div className="relative flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-text-soft">
            {content.ui.mock.decisionPackLabel}
          </div>
          <div className="mt-2 max-w-[28ch] text-xl font-[family:var(--font-instrument-serif)] font-semibold text-text sm:text-2xl">
            {content.ui.mock.samplePackTitle}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-[var(--rPill)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] font-semibold text-text-soft">
            {content.ui.mock.reviewStatus}
          </span>
          <span className="rounded-[var(--rPill)] border border-[rgba(143,214,163,0.34)] bg-[rgba(143,214,163,0.16)] px-3 py-1 text-[11px] font-semibold text-success">
            {content.ui.mock.verifiedStatus}
          </span>
        </div>
      </div>

      <div className="relative grid gap-5 p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr),minmax(280px,0.85fr)]">
          <div className="rounded-[28px] border border-[rgba(255,255,255,0.07)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-text-soft">
                {content.ui.mock.documentViewer}
              </div>
              <div className="rounded-[var(--rPill)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[10px] tracking-[0.16em] uppercase text-text-soft">
                PDF
              </div>
            </div>
            <div className="mt-5 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(19,19,22,0.24)] p-5">
              <div className="space-y-3">
                <div className="h-2.5 w-11/12 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="h-2.5 w-8/12 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="h-2.5 w-10/12 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="h-2.5 w-7/12 rounded-full bg-[rgba(255,255,255,0.08)]" />
              </div>
              <div className="mt-5 rounded-[20px] border border-[rgba(166,227,184,0.3)] bg-[rgba(166,227,184,0.08)] p-4 text-sm leading-7 text-[#A6E3B8]">
                {content.ui.mock.highlightSnippet}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[4, 12].map((page) => (
                  <div
                    key={page}
                    className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] p-3"
                  >
                    <div className="text-xs text-text-soft">{pageLabel(page)}</div>
                    <div className="mt-2 h-12 rounded-[14px] bg-[rgba(255,255,255,0.06)]" />
                    <div className="mt-2 h-2 w-8/12 rounded-full bg-[rgba(166,227,184,0.24)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-text-soft">
                {content.ui.mock.verifiedVariables}
              </div>
              <div className="mt-4 space-y-3">
                {factRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-[22px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-text-soft">{row.label}</div>
                      <span
                        className={cn(
                          'rounded-[var(--rPill)] px-2.5 py-1 text-[11px] font-semibold',
                          row.accent === 'success'
                            ? 'border border-[rgba(143,214,163,0.32)] bg-[rgba(143,214,163,0.16)] text-success'
                            : 'border border-[rgba(166,227,184,0.28)] bg-[rgba(166,227,184,0.06)] text-[#A6E3B8]'
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-2 text-base text-text">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[rgba(166,227,184,0.28)] bg-[linear-gradient(180deg,rgba(166,227,184,0.12),rgba(166,227,184,0.05))] p-5">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#A6E3B8]">
                {content.ui.mock.exceptionsQueueTitle}
              </div>
              <div className="mt-3 text-lg leading-relaxed text-text sm:text-xl">
                {content.ui.mock.exceptionsQueueBody}
              </div>
            </div>

            <div className="rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] p-5">
              <div className="text-[11px] tracking-[0.18em] uppercase text-text-soft">
                {content.ui.mock.fieldEvidenceLabel}
              </div>
              <div className="mt-4 grid gap-2">
                {[pageLabel(4), pageLabel(12)].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                  >
                    <span className="text-sm text-text">{label}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-text-soft">
                      {content.ui.mock.evidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisualScene({
  content,
  isRtl,
  reducedMotion,
}: {
  content: Content;
  isRtl: boolean;
  reducedMotion: boolean;
}) {
  const factRows = [
    {
      label: content.ui.mock.sampleGoverningLawLabel,
      value: content.ui.mock.sampleGoverningLawValue,
      tone: "success",
      status: content.ui.mock.verifiedStatus,
    },
    {
      label: content.ui.mock.samplePartyALabel,
      value: content.ui.mock.samplePartyAValue,
      tone: "success",
      status: content.ui.mock.verifiedStatus,
    },
    {
      label: content.ui.mock.sampleEffectiveDateLabel,
      value: content.ui.mock.sampleEffectiveDateValue,
      tone: "warning",
      status: content.ui.mock.reviewStatus,
    },
    {
      label: content.ui.mock.sampleTermLabel,
      value: content.ui.mock.sampleTermMonthsValue,
      tone: "success",
      status: content.ui.mock.verifiedStatus,
    },
  ] as const;

  const pulseClass = reducedMotion ? "" : "homepage-scene-pulse";

  return (
    <div className={cn("relative mx-auto w-full", isRtl ? "max-w-[780px]" : "max-w-[760px]")}>
      {/* Ambient glow behind the card */}
      <div className="pointer-events-none absolute -inset-6 rounded-[50px] bg-[radial-gradient(ellipse_at_60%_30%,rgba(166,227,184,0.12),transparent_55%)]" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.09)] bg-[#101112] shadow-[0_32px_100px_rgba(0,0,0,0.5)]">

        {/* Window chrome bar */}
        <div className={cn(
          "flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-5 py-3.5",
          isRtl && "flex-row-reverse"
        )}>
          <div className={cn("flex items-center gap-1.5", isRtl && "flex-row-reverse")}>
            <span className="h-3 w-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <span className="h-3 w-3 rounded-full bg-[rgba(255,255,255,0.07)]" />
            <span className="h-3 w-3 rounded-full bg-[rgba(255,255,255,0.04)]" />
          </div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-[rgba(255,255,255,0.35)]">
            {content.ui.mock.samplePackTitle}
          </div>
          <span className="rounded-full border border-[rgba(143,214,163,0.34)] bg-[rgba(143,214,163,0.14)] px-2.5 py-1 text-success">
            {content.ui.mock.verifiedStatus}
          </span>
        </div>

        {/* Two-column body */}
        <div className={cn("grid", isRtl ? "sm:grid-cols-[1fr,0.95fr]" : "sm:grid-cols-[1fr,0.95fr]")}>

          {/* Left: Document viewer */}
          <div className={cn("border-[rgba(255,255,255,0.06)] p-5 sm:p-6", isRtl ? "border-l" : "border-r")}>
            <div className={cn("mb-4 flex items-center justify-between", isRtl && "flex-row-reverse")}>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[rgba(255,255,255,0.35)]">
                {content.ui.mock.documentViewer}
              </span>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 text-[9px] tracking-[0.12em] uppercase text-[rgba(255,255,255,0.35)]">
                PDF
              </span>
            </div>

            {/* Document text lines */}
            <div className="space-y-2 mb-5">
              <div className="h-2 w-full rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="h-2 w-10/12 rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="h-2 w-11/12 rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="h-2 w-7/12 rounded-full bg-[rgba(255,255,255,0.07)]" />
            </div>

            {/* Highlighted / extracted clause */}
            <div className="rounded-[14px] border border-[rgba(166,227,184,0.28)] bg-[rgba(166,227,184,0.07)] px-4 py-3.5 mb-5">
              <div className={cn("mb-2 flex items-center gap-1.5", isRtl && "flex-row-reverse")}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A6E3B8] shrink-0" />
                <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#A6E3B8]">
                  {content.ui.mock.fieldEvidenceLabel}
                </span>
              </div>
              <p className={cn("text-sm leading-6 text-[#A6E3B8]/80", isRtl && "text-right")}>
                {content.ui.mock.highlightSnippet}
              </p>
            </div>

            {/* More faded text lines */}
            <div className="space-y-2">
              <div className="h-2 w-11/12 rounded-full bg-[rgba(255,255,255,0.04)]" />
              <div className="h-2 w-9/12 rounded-full bg-[rgba(255,255,255,0.04)]" />
              <div className="h-2 w-10/12 rounded-full bg-[rgba(255,255,255,0.04)]" />
            </div>
          </div>

          {/* Right: Extracted & verified fields */}
          <div className="p-5 sm:p-6">
            <div className={cn("mb-4 flex items-center justify-between", isRtl && "flex-row-reverse")}>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[rgba(255,255,255,0.35)]">
                {content.ui.mock.verifiedVariables}
              </span>
            </div>

            <div className="space-y-2">
              {factRows.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] px-3.5 py-2.5",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <div className={cn("min-w-0", isRtl && "text-right")}>
                    <div className="text-[10px] text-[rgba(255,255,255,0.38)] mb-0.5">{row.label}</div>
                    <div className="text-[13px] font-medium text-text">{row.value}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      row.tone === "success"
                        ? "border border-[rgba(143,214,163,0.3)] bg-[rgba(143,214,163,0.12)] text-success"
                        : "border border-[rgba(166,227,184,0.28)] bg-[rgba(166,227,184,0.08)] text-[#A6E3B8]"
                    )}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Exception / alert card */}
            <div className="mt-3 rounded-[12px] border border-[rgba(166,227,184,0.22)] bg-[rgba(166,227,184,0.06)] px-3.5 py-3">
              <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
                <span className={cn("h-2 w-2 rounded-full bg-[#A6E3B8] shrink-0", pulseClass)} />
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#A6E3B8]">
                  {content.ui.mock.exceptionsQueueTitle}
                </span>
              </div>
              <p className={cn("text-[12px] leading-5 text-[rgba(255,255,255,0.45)]", isRtl && "text-right")}>
                {content.ui.mock.exceptionsQueueBody}
              </p>
            </div>
          </div>
        </div>

        {/* Footer stat strip */}
        <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-3">
          <div className={cn("flex flex-wrap items-center gap-2", isRtl && "flex-row-reverse")}>
            {content.ui.decisionPackPreview.deliverables.slice(0, 3).map((label) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                <span className="text-[11px] text-[rgba(255,255,255,0.45)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ content }: { content: Content }) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-12 lg:px-[72px]">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {content.footer.columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-soft transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <Link
            href="/home"
            className="font-[family:var(--font-instrument-serif)] text-xl font-semibold text-text transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-highlight focus-visible:outline-offset-2"
          >
            {content.brand.name}
          </Link>
          <p className="max-w-[52ch] text-xs leading-5 text-text-muted">
            {content.footer.legalNote}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Homepage() {
  const content = useMarketingHomeContent();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div
      data-theme="zohal-light"
      className="website-shell relative isolate min-h-screen overflow-x-hidden bg-[color:var(--bg)] font-[family:var(--font-plus-jakarta)]"
    >
      <Nav content={content} />

      <main className="relative z-10 pt-[78px]">
        <Section className="grid min-h-[calc(100svh-78px)] place-items-center py-8 transition-all duration-500 sm:py-10 lg:py-12">
          <div className="relative mx-auto w-full max-w-[1060px] text-center">
            <Reveal>
              <div className="mb-5 flex justify-center overflow-hidden transition-all duration-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-[11px] font-medium tracking-[0.06em] text-text-muted shadow-[var(--shadowSm)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {content.brand.tagline}
                </span>
              </div>
              <h1 className="mx-auto max-w-[18ch] overflow-hidden font-[family:var(--font-instrument-serif)] text-[2.4rem] font-semibold leading-[1.08] tracking-tight text-text transition-all duration-500 sm:text-[3rem] lg:text-[3.6rem]">
                {content.hero.headline}
              </h1>
              <p className="mx-auto mt-5 max-w-[40rem] overflow-hidden text-[0.95rem] leading-7 text-text-soft transition-all duration-500 sm:text-base sm:leading-8">
                {content.hero.subhead}
              </p>

              <p className="mx-auto mt-5 max-w-[42rem] overflow-hidden text-xs leading-6 text-text-muted transition-all duration-500 sm:text-sm">
                {content.hero.proofLine}
              </p>
            </Reveal>
          </div>
        </Section>

      </main>
      <Footer content={content} />
    </div>
  );
}
