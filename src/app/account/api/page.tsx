import type { Metadata } from "next";
import { ApiAccountView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "API ve MCP anahtarları", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function ApiAccountPage() {
  return <ApiAccountView locale="tr" />;
}
