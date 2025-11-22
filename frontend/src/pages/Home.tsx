import { Link } from 'react-router-dom';
import { Shield, Lock, Cloud, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Resilient Certificate System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure, decentralized academic credentials backed by blockchain technology
              with built-in recovery mechanisms
            </p>
            <div className="flex gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Link to={user?.role === 'university' ? '/university' : '/student'}>
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link to="/verify">
                    <Button size="lg" variant="outline">Verify Certificate</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2" />
                <CardTitle>Blockchain-Backed</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Immutable proof of issuance on Ethereum Sepolia testnet
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 mb-2" />
                <CardTitle>Client-Side Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AES-256-GCM encryption ensures your data never leaves your browser unencrypted
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-10 w-10 mb-2" />
                <CardTitle>Decentralized Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Certificates stored on IPFS via Filebase for permanent, censorship-resistant access
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <RefreshCw className="h-10 w-10 mb-2" />
                <CardTitle>Recovery System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Shamir Secret Sharing with 3 custodians ensures credential recovery even if issuer is offline
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold">Issue</h3>
              <p className="text-muted-foreground">
                Universities encrypt and upload certificates. Metadata and hashes are stored on the blockchain.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold">Verify</h3>
              <p className="text-muted-foreground">
                Anyone can verify a certificate by uploading the PDF or entering metadata. No authentication required.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold">Recover</h3>
              <p className="text-muted-foreground">
                Students can recover credentials through custodians, even if the university's servers are down.
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
