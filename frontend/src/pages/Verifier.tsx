import Navbar from '@/components/Navbar';
import VerifySection from '@/components/VerifySection';

export default function Verifier() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container pt-20 pb-16">
        <VerifySection />
      </main>
    </div>
  );
}
