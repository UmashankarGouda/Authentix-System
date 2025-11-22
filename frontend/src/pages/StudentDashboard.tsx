import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Download } from 'lucide-react';
import { certificateAPI, Credential } from '@/lib/api';

export default function StudentDashboard() {
  const [certificates, setCertificates] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const data = await certificateAPI.list();
      setCertificates(data);
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">My Certificates</h2>
            <p className="text-muted-foreground">View and download your academic credentials</p>
          </div>

          {isLoading ? (
            <p>Loading...</p>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No certificates available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <CardTitle>{cert.degreeName}</CardTitle>
                    <CardDescription>
                      {cert.university?.name} | Graduation Year: {cert.graduationYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Credential Number</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs">{cert.credentialNo}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(cert.credentialNo, 'Credential Number')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">File Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{cert.fileHash}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(cert.fileHash, 'File Hash')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">JSON Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{cert.jsonHash}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(cert.jsonHash, 'JSON Hash')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">IPFS CID</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{cert.ipfsCID}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(cert.ipfsCID, 'IPFS CID')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Blockchain Transaction</p>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${cert.blockchainTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View on Etherscan →
                        </a>
                      </div>

                      <div className="pt-2">
                        <Button className="w-full" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download Certificate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
