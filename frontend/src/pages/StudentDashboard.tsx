import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Download, FileText, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { certificateAPI, Credential } from '@/lib/api';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-zinc-200/50 dark:bg-grid-zinc-800/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 container max-w-5xl mx-auto pt-28 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">My Certificates</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">View and download your academic credentials</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : certificates.length === 0 ? (
              <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-transparent shadow-none">
                <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No certificates available yet</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Your issued certificates will appear here once verified.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {certificates.map((cert) => (
                  <Card key={cert.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-zinc-900 overflow-hidden group">
                    <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{cert.degreeName}</CardTitle>
                          <CardDescription className="mt-1.5 flex items-center gap-2 text-base">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{cert.university?.name}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">|</span>
                            <span>Graduation Year: {cert.graduationYear}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 capitalize">Verified</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Credential Number */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Credential Number</p>
                        <div className="flex items-center gap-2 group/field">
                          <div className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                            {cert.credentialNo}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 opacity-0 group-hover/field:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => copyToClipboard(cert.credentialNo, 'Credential Number')}
                          >
                            <Copy className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Hashes Grid */}
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">File Hash</p>
                          <div className="flex items-center gap-2 group/field">
                            <div className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">
                              {cert.fileHash}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 opacity-0 group-hover/field:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              onClick={() => copyToClipboard(cert.fileHash, 'File Hash')}
                            >
                              <Copy className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">JSON Hash</p>
                          <div className="flex items-center gap-2 group/field">
                            <div className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">
                              {cert.jsonHash}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 opacity-0 group-hover/field:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              onClick={() => copyToClipboard(cert.jsonHash, 'JSON Hash')}
                            >
                              <Copy className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">IPFS CID</p>
                          <div className="flex items-center gap-2 group/field">
                            <div className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">
                              {cert.ipfsCID}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 opacity-0 group-hover/field:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              onClick={() => copyToClipboard(cert.ipfsCID, 'IPFS CID')}
                            >
                              <Copy className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain & Actions */}
                      <div className="pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Blockchain Transaction</p>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${cert.blockchainTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                          >
                            View on Etherscan
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        <Button className="w-full md:w-auto min-w-[200px] h-11 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all">
                          <Download className="mr-2 h-4 w-4" />
                          Download Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
