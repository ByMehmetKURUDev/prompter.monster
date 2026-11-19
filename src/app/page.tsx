import type { Metadata } from "next";
import { LandingView } from "@/components/site/LandingView";
import { socialFor } from "@/lib/i18n";

export const metadata: Metadata = {
  ...socialFor(
    "/",
    "tr",
    "Prompter.Monster — Fikirden master build prompt'a",
    "18 uzman canavar, 8 adımlı mega chain, 5 çıktı formatı. Fikrini AI kodlama araçlarına hazır prompt'a çevir.",
  ),
};

export default function Landing() {
  return <LandingView locale="tr" />;
}
