import { requireUser } from "@/lib/auth";
import Nav from "@/components/Nav";
import MobileTabBar from "@/components/MobileTabBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Nav user={user} />
      <main className="max-w-7xl mx-auto px-4 py-4 pb-24 md:px-6 md:py-8 md:pb-8">
        {children}
      </main>
      <MobileTabBar user={user} />
    </div>
  );
}
