import Navbar from '@/components/Navbar';
import VerifySection from '@/components/VerifySection';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Primary: Verify Certificate */}
        <section className="border-b bg-muted/40 py-16">
          <div className="container">
            <VerifySection />
          </div>
        </section>

        {/* About the project */}
        <section className="container py-16 space-y-8">
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">About the Resilient Certificate System</h2>
            <p className="text-lg text-muted-foreground">
              This project provides a tamper-evident way to issue and verify academic credentials using
              blockchain, end-to-end encryption, decentralized storage, and a recovery-friendly design.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mt-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">On-chain registry</h3>
              <p className="text-muted-foreground text-sm">
                Each credential is hashed and recorded on the Ethereum Sepolia testnet via a
                dedicated smart contract, so anyone can prove issuance independently of our servers.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Encrypted, decentralized storage</h3>
              <p className="text-muted-foreground text-sm">
                Certificates are encrypted in the browser using AES-256-GCM and stored on IPFS via Filebase.
                The raw document never leaves the client unencrypted.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Recovery via custodians</h3>
              <p className="text-muted-foreground text-sm">
                The encryption key is split with Shamirs Secret Sharing and encrypted for independent
                custodians, so students can recover access even if the issuing university is offline.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Resilient Certificate System. Built with blockchain technology.</p>
        </div>
      </footer>
    </div>
  );
}
