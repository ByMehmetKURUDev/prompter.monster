import type { Metadata } from "next";
import { ApiAccountView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "API & MCP keys", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function ApiAccountPageEn() {
  return <ApiAccountView locale="en" />;
}
