import HomeView from "@/features/home/home-view";
export default function Home(props: { searchParams: Promise<{ auth?: string; token?: string }> }) { return <HomeView {...props} />; }
