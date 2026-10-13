import PlayLayout from "@/app/play/layout";
import OfflinePlayer from "@/features/pwa/offline-player";

export const dynamic = "force-static";
export const metadata = { robots: { index: false, follow: false } };
export default function OfflinePage() {
  return <PlayLayout><OfflinePlayer /></PlayLayout>;
}
