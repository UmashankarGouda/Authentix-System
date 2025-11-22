import Navbar from '@/components/Navbar';
import ModernVerifySection from '@/components/ModernVerifySection';

export default function Verifier() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <ModernVerifySection />
        </div>
      </main>
    </div>
  );
}
