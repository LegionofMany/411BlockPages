import { redirect } from "next/navigation";

export default function LiveTransactionsAliasPage() {
  // Canonical live feed route lives at /realtime-transactions.
  redirect("/realtime-transactions");
}
