import Script from "next/script";

/**
 * Optional tags, each enabled only when its env var is set at build time (NEXT_PUBLIC_*).
 * - NEXT_PUBLIC_GA_ID          G-XXXXXXX   (Google Analytics 4)
 * - NEXT_PUBLIC_GADS_ID        AW-XXXXXXX  (Google Ads conversion tag; same gtag loader)
 * - NEXT_PUBLIC_META_PIXEL_ID  1234567890  (Meta Pixel)
 * Events are sent through src/lib/track.ts.
 */
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const ads = process.env.NEXT_PUBLIC_GADS_ID;
  const meta = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gtagId = ga || ads;
  if (!gtagId && !meta) return null;
  return (
    <>
      {gtagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());` +
              `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});` +
              (ga ? `gtag('config','${ga}',{anonymize_ip:true});` : "") +
              (ads ? `gtag('config','${ads}');` : "")}
          </Script>
        </>
      )}
      {meta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
