import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";

// Plan limits, credit costs and the launch coupon come from the admin settings at request time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Prompt.Monster ücretsiz başlar: günde 5 AI kredisi, 3 uzman, proje kütüphanesi. Monster Pro $29/ay: ayda 1.000 AI kredisi, 12 uzman, Mega Chain, 5 format ve Export to Builders.",
  alternates: { canonical: "https://prompter.monster/pricing" },
  openGraph: { title: "Prompt.Monster fiyatlandırma", description: "Ücretsiz başla, ciddiye alınca Pro'ya geç. $29/ay veya $290/yıl.", url: "https://prompter.monster/pricing" },
};

export default function PricingPage() {
  return <PricingView locale="tr" />;
}
