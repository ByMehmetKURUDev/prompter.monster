import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";
import { alternatesFor } from "@/lib/i18n";

// Plan limits, credit costs and the launch coupon come from the admin settings at request time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Prompt.Monster ücretsiz başlar: günde 5 AI kredisi, 3 uzman, proje kütüphanesi. Monster Pro $29/ay: ayda 1.000 AI kredisi, 18 uzman, Mega Chain, 5 format ve Export to Builders.",
  alternates: alternatesFor("/pricing", "tr"),
  openGraph: { title: "Prompt.Monster fiyatlandırma", description: "Ücretsiz başla, ciddiye alınca Pro'ya geç. $29/ay veya $290/yıl.", url: "https://prompter.monster/pricing" },
};

export default function PricingPage() {
  return <PricingView locale="tr" />;
}
