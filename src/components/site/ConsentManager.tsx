"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import {
  CONSENT_OPEN_EVENT,
  GADS_ID,
  GA_ID,
  META_PIXEL_ID,
  clearTrackingCookies,
  readConsent,
  trackingConfigured,
  writeConsent,
  type Consent,
} from "@/lib/consent";
import { localePath } from "@/lib/i18n";
import { usePathLocale } from "./LocaleProvider";
import { cx } from "@/lib/cx";

/**
 * Cookie banner + loader for the optional tags (GA4, Google Ads, Meta Pixel).
 * Nothing optional loads before consent. Renders nothing when no tag is configured.
 */

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & Record<string, unknown>; _fbq?: unknown; __pmGtag?: boolean; __pmPixel?: boolean; __pmConfigured?: Set<string> };

function ensureGtag(firstId: string) {
  const w = window as W;
  if (w.__pmGtag) return;
  w.__pmGtag = true;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js expects the Arguments object itself.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });
  w.gtag("js", new Date());
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstId)}`;
  document.head.appendChild(s);
}

function applyGtag(c: Consent) {
  const wantsGa = c.analytics && GA_ID;
  const wantsAds = c.marketing && GADS_ID;
  if (!wantsGa && !wantsAds) return;
  ensureGtag((wantsGa ? GA_ID : GADS_ID) as string);
  const w = window as W;
  const g = w.gtag!;
  g("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
  w.__pmConfigured = w.__pmConfigured || new Set();
  if (wantsGa && !w.__pmConfigured.has(GA_ID)) {
    g("config", GA_ID, { anonymize_ip: true });
    w.__pmConfigured.add(GA_ID);
  }
  if (wantsAds && !w.__pmConfigured.has(GADS_ID)) {
    g("config", GADS_ID);
    w.__pmConfigured.add(GADS_ID);
  }
}

function loadPixel() {
  const w = window as W;
  if (!META_PIXEL_ID || w.__pmPixel) return;
  w.__pmPixel = true;
  /* Standard Meta Pixel bootstrap, written out so it only runs after marketing consent. */
  const n = function (...args: unknown[]) {
    const self = n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
    if (self.callMethod) self.callMethod(...args);
    else self.queue.push(args);
  } as unknown as W["fbq"] & { push: unknown; loaded: boolean; version: string; queue: unknown[] };
  if (!w._fbq) w._fbq = n;
  n!.push = n;
  n!.loaded = true;
  n!.version = "2.0";
  n!.queue = [];
  w.fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  w.fbq!("consent", "grant");
  w.fbq!("init", META_PIXEL_ID);
  w.fbq!("track", "PageView");
}

function apply(c: Consent) {
  try {
    applyGtag(c);
    if (c.marketing) loadPixel();
  } catch {
    /* analytics must never break the app */
  }
}

const COPY = {
  tr: {
    title: "Çerez tercihlerin",
    body: "Siteyi çalıştırmak için yalnızca zorunlu çerezleri kullanıyoruz. İzin verirsen ziyaretleri ölçmek (Google Analytics) ve reklamlarımızın işe yarayıp yaramadığını görmek (Google Ads, Meta) için ek çerezler kullanırız.",
    policy: "Çerez Politikası",
    reject: "Reddet",
    accept: "Tümünü kabul et",
    prefs: "Tercihler",
    save: "Seçimi kaydet",
    necessary: "Zorunlu",
    necessaryHint: "Oturum, dil ve tercihlerin. Her zaman açık.",
    analytics: "Analitik",
    analyticsHint: "Google Analytics 4 — anonimleştirilmiş ziyaret istatistikleri.",
    marketing: "Reklam ölçümü",
    marketingHint: "Google Ads ve Meta Pixel — reklamdan gelen kayıt/satın alma ölçümü.",
    on: "Açık",
  },
  en: {
    title: "Your cookie choices",
    body: "We only use strictly necessary cookies to run the site. With your permission we also use cookies to measure visits (Google Analytics) and to see whether our ads work (Google Ads, Meta).",
    policy: "Cookie Policy",
    reject: "Reject",
    accept: "Accept all",
    prefs: "Preferences",
    save: "Save choices",
    necessary: "Necessary",
    necessaryHint: "Session, language and your choices. Always on.",
    analytics: "Analytics",
    analyticsHint: "Google Analytics 4 — anonymised visit statistics.",
    marketing: "Ad measurement",
    marketingHint: "Google Ads and Meta Pixel — measuring sign-ups/purchases from ads.",
    on: "On",
  },
} as const;

export function ConsentManager() {
  const pathname = usePathname();
  const locale = usePathLocale();
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [draft, setDraft] = useState<Consent>({ analytics: false, marketing: false });
  const current = useRef<Consent | null>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    if (!trackingConfigured()) return;
    const saved = readConsent();
    current.current = saved;
    if (saved) {
      apply(saved);
      setDraft(saved);
    } else {
      setOpen(true);
    }
    const onOpen = () => {
      setDraft(readConsent() ?? { analytics: false, marketing: false });
      setPrefs(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  // Meta Pixel does not see client-side navigations on its own (GA4 enhanced measurement does).
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    try {
      if (current.current?.marketing) (window as W).fbq?.("track", "PageView");
    } catch {
      /* ignore */
    }
  }, [pathname]);

  const decide = useCallback((next: Consent) => {
    const prev = current.current;
    writeConsent(next);
    current.current = next;
    setOpen(false);
    setPrefs(false);
    const revoked = prev && ((prev.analytics && !next.analytics) || (prev.marketing && !next.marketing));
    if (revoked) {
      clearTrackingCookies();
      window.location.reload(); // unloads tags that were already running
      return;
    }
    apply(next);
  }, []);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="pm-consent-title" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-[760px] rounded-2xl bg-ink-900/95 backdrop-blur border border-ink-600 shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-lime shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="pm-consent-title" className="text-[14px] font-bold">
              {c.title}
            </h2>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
              {c.body}{" "}
              <a href={localePath("/legal/cookies", locale)} className="text-zinc-200 underline">
                {c.policy}
              </a>
            </p>

            {prefs && (
              <div className="mt-3 divide-y divide-ink-600 rounded-xl border border-ink-600 bg-ink-950">
                <Row label={c.necessary} hint={c.necessaryHint} checked disabled onLabel={c.on} />
                {GA_ID && <Row label={c.analytics} hint={c.analyticsHint} checked={draft.analytics} onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))} onLabel={c.on} />}
                {(GADS_ID || META_PIXEL_ID) && <Row label={c.marketing} hint={c.marketingHint} checked={draft.marketing} onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))} onLabel={c.on} />}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => decide({ analytics: false, marketing: false })} className="h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold">
                {c.reject}
              </button>
              <button type="button" onClick={() => decide({ analytics: true, marketing: true })} className="h-9 px-4 rounded-lg bg-lime text-black text-[12.5px] font-bold">
                {c.accept}
              </button>
              {prefs ? (
                <button type="button" onClick={() => decide(draft)} className="h-9 px-4 rounded-lg border border-ink-400 text-[12.5px] font-semibold text-zinc-200">
                  {c.save}
                </button>
              ) : (
                <button type="button" onClick={() => setPrefs(true)} className="h-9 px-3 text-[12.5px] text-zinc-400 hover:text-white underline">
                  {c.prefs}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, hint, checked, disabled, onChange, onLabel }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void; onLabel: string }) {
  return (
    <label className={cx("flex items-center gap-3 px-3 py-2.5", disabled ? "opacity-70" : "cursor-pointer")}>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold">{label}</div>
        <div className="text-[11.5px] text-zinc-500">{hint}</div>
      </div>
      {disabled ? (
        <span className="text-[10px] font-bold tracking-wider text-lime">{onLabel.toUpperCase()}</span>
      ) : (
        <input type="checkbox" className="w-4 h-4 accent-[#A3FF12]" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      )}
    </label>
  );
}
