import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";
import { alternatesFor, ogImages } from "@/lib/i18n";

// Plan limits, credit costs and the launch coupon come from the admin settings at request time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Ücretsiz başla: günde 5 AI kredisi, 3 uzman, proje kütüphanesi. Monster Pro $29/ay: ayda 1.000 AI kredisi, 18 uzman, Mega Chain, 5 format ve Export to Builders.",
  alternates: alternatesFor("/pricing", "tr"),
  openGraph: { title: "Prompt.Monster fiyatlandırma", description: "Ücretsiz başla, ciddiye alınca Pro'ya geç. $29/ay veya $290/yıl.", url: "https://prompter.monster/pricing", siteName: "Prompt.Monster", locale: "tr_TR", type: "website", images: ogImages("tr") },
};

export default function PricingPage() {
  return <PricingView locale="tr" />;
}
