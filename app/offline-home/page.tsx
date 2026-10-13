import HomeView from "@/features/home/home-view";

export const dynamic = "force-static";
export const metadata = { robots: { index: false, follow: false } };
export default function OfflineHome() {
  return <HomeView offline searchParams={Promise.resolve({})} />;
}
