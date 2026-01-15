import { redirect } from "next/navigation";

export default function WalletAnalysisAliasPage() {
  // Keep the existing /search implementation as the canonical wallet analysis UI.
  redirect("/search");
}
