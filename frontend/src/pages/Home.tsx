import Navbar from '@/components/Navbar';
import ModernVerifySection from '@/components/ModernVerifySection';
import FAQSection from '@/components/FAQSection';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-zinc-200/50 dark:bg-grid-zinc-800/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pt-32 pb-16">
          {/* Hero Section */}
          <section className="container px-4 md:px-6 space-y-12 text-center">
            <div className="space-y-4 max-w-3xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Verify the authenticity of certificates
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto"
              >
                A secure, blockchain-based verification system for academic credentials.
                Tamper-proof, instant, and globally accessible.
              </motion.p>
            </div>

            {/* Verify Section */}
            <div className="w-full">
              <ModernVerifySection />
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container px-4 md:px-6 mt-8 pt-8 scroll-mt-24" id="faq-section">
            <FAQSection />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-900">
          <div className="container text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p>© 2025 Resilient Certificate System. Built with blockchain technology.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
