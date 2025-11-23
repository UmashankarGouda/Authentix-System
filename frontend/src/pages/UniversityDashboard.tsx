import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileUp, CheckCircle2, Loader2, Lock, UploadCloud, Database, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { certificateAPI, custodianAPI, Custodian, Credential } from '@/lib/api';

import {
  generateAESKey,
  generateIV,
  encryptAESGCM,
  exportAESKey,
  bufferToHex,
  sha256Bytes32,
  hashCanonicalJSON,
  readFileAsArrayBuffer,
  splitSecret,
  importRSAPublicKey,
  encryptRSA,
} from '@/lib/crypto';

interface IssueForm {
  studentEmail: string;
  degreeName: string;
  graduationYear: string;
  credentialNo: string;
  file: FileList;
}

type StepState = 'idle' | 'pending' | 'success' | 'error';

interface IssuanceStep {
  key: 'prepare' | 'ipfs' | 'blockchain' | 'db';
  label: string;
  icon: React.ElementType;
  state: StepState;
}

function IssueCertificate() {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<IssuanceStep[]>([
    { key: 'prepare', label: 'Encrypt & Sign', icon: Lock, state: 'idle' },
    { key: 'ipfs', label: 'Upload Encrypted', icon: UploadCloud, state: 'idle' },
    { key: 'blockchain', label: 'Record Credential', icon: Database, state: 'idle' },
    { key: 'db', label: 'Save Credential', icon: Save, state: 'idle' },
  ]);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<IssueForm>();

  // Watch file input for custom display
  const fileList = watch('file');
  const fileName = fileList && fileList.length > 0 ? fileList[0].name : 'No file chosen';

  const setStepState = (key: IssuanceStep['key'], state: StepState) => {
    setSteps(prev => prev.map(step => step.key === key ? { ...step, state } : step));
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, state: 'idle' })));
  };

  useEffect(() => {
    loadCustodians();
  }, []);

  const loadCustodians = async () => {
    try {
      const data = await custodianAPI.getAll();
      setCustodians(data);
    } catch (error) {
      toast.error('Failed to load custodians');
    }
  };

  const onSubmit = async (data: IssueForm) => {
    if (!data.file || data.file.length === 0) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);
    resetSteps();
    try {
      const file = data.file[0];

      // Local preparation phase
      setStepState('prepare', 'pending');

      // Step 1: Read file
      const fileBuffer = await readFileAsArrayBuffer(file);

      // Step 2: Compute file hash BEFORE encryption (so verifier can use original file)
      const fileHash = await sha256Bytes32(fileBuffer);

      // Step 3: Generate AES key and IV
      const aesKey = await generateAESKey();
      const iv = generateIV();

      // Step 4: Encrypt file
      const { ciphertext, authTag } = await encryptAESGCM(fileBuffer, aesKey, iv);

      // Step 5: Create canonical JSON and compute jsonHash
      const metadata = {
        credentialNo: data.credentialNo,
        degreeName: data.degreeName,
        graduationYear: parseInt(data.graduationYear),
        studentEmail: data.studentEmail,
      };
      const jsonHash = await hashCanonicalJSON(metadata);

      // Step 6: Export AES key and split with Shamir
      const keyBytes = await exportAESKey(aesKey);
      const keyHex = bufferToHex(keyBytes);
      const shares = splitSecret(keyHex, 3, 2); // 3 shares, threshold 2

      // Step 7: Encrypt shares with custodian public keys
      const encryptedShares: { custodianId: string; encryptedShare: string }[] = [];
      for (let i = 0; i < Math.min(custodians.length, shares.length); i++) {
        const custodian = custodians[i];
        const publicKey = await importRSAPublicKey(custodian.publicKey);
        const shareBytes = new TextEncoder().encode(shares[i]);
        const encryptedShare = await encryptRSA(shareBytes.buffer, publicKey);
        encryptedShares.push({
          custodianId: custodian.id,
          encryptedShare,
        });
      }

      // Step 8: Prepare form data
      const formData = new FormData();
      const encryptedFile = new Blob([ciphertext]);
      formData.append('file', encryptedFile, file.name);
      formData.append('fileHash', fileHash);
      formData.append('jsonHash', jsonHash);
      formData.append('iv', bufferToHex(iv.buffer as ArrayBuffer));
      formData.append('authTag', bufferToHex(authTag));
      formData.append('encryptedShares', JSON.stringify(encryptedShares));
      formData.append('metadata', JSON.stringify(metadata));

      // Network phase: backend handles IPFS, blockchain, and DB writes
      setStepState('prepare', 'success');
      setStepState('ipfs', 'pending');
      setStepState('blockchain', 'pending');
      setStepState('db', 'pending');

      // Step 9: Upload to backend (IPFS + blockchain + DB)
      const result = await certificateAPI.issue(formData);

      // If we reach here, all backend steps have succeeded
      setStepState('ipfs', 'success');
      setStepState('blockchain', 'success');
      setStepState('db', 'success');

      toast.success(`Certificate issued successfully! TX: ${result.blockchainTx?.slice(0, 10)}...`);
      reset();
    } catch (error: any) {
      console.error('Issuance error:', error);
      // Mark remaining steps as errored to reflect failure
      setStepState('ipfs', steps.find(s => s.key === 'ipfs')?.state === 'success' ? 'success' : 'error');
      setStepState('blockchain', steps.find(s => s.key === 'blockchain')?.state === 'success' ? 'success' : 'error');
      setStepState('db', 'error');
      toast.error(error.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Issue Certificate</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Upload and encrypt a new certificate</p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <CardTitle className="text-xl">Certificate Details</CardTitle>
          <CardDescription>Fill in the details and upload the PDF certificate</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studentEmail" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Student Email</Label>
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="Student Email"
                  className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                  {...register('studentEmail', { required: 'Required' })}
                />
                {errors.studentEmail && <p className="text-sm text-red-500">{errors.studentEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialNo" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Credential Number</Label>
                <Input
                  id="credentialNo"
                  placeholder="Credential Number"
                  className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                  {...register('credentialNo', { required: 'Required' })}
                />
                {errors.credentialNo && <p className="text-sm text-red-500">{errors.credentialNo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Degree Name</Label>
                <Input
                  id="degreeName"
                  placeholder="Degree Name"
                  className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                  {...register('degreeName', { required: 'Required' })}
                />
                {errors.degreeName && <p className="text-sm text-red-500">{errors.degreeName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  placeholder="Graduation Year"
                  className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                  {...register('graduationYear', { required: 'Required' })}
                />
                {errors.graduationYear && <p className="text-sm text-red-500">{errors.graduationYear.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Certificate PDF</Label>
              <div className="relative group">
                <div className="flex items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <FileUp className="h-6 w-6" />
                    <span className="text-sm">{fileName !== 'No file chosen' ? fileName : 'Drag & drop or click to upload'}</span>
                  </div>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    {...register('file', { required: 'File is required' })}
                  />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Button variant="secondary" size="sm" className="h-8 text-xs">Choose file</Button>
                </div>
              </div>
              {errors.file && <p className="text-sm text-red-500">{errors.file.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all font-medium text-base shadow-md"
            >
              {isLoading ? 'Issuing Certificate...' : 'Issue Certificate'}
            </Button>
          </form>

          {/* Horizontal Stepper */}
          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
            <div className="relative flex justify-between">
              {/* Connecting Line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-10" />

              {steps.map((step) => {
                const Icon = step.icon;
                let iconColor = "text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
                let textColor = "text-zinc-400";

                if (step.state === 'success') {
                  iconColor = "text-white bg-zinc-900 border-zinc-900";
                  textColor = "text-zinc-900 dark:text-zinc-100 font-medium";
                } else if (step.state === 'pending') {
                  iconColor = "text-zinc-900 bg-white border-zinc-900 animate-pulse";
                  textColor = "text-zinc-900 font-medium";
                } else if (step.state === 'error') {
                  iconColor = "text-white bg-red-500 border-red-500";
                  textColor = "text-red-500 font-medium";
                }

                return (
                  <div key={step.key} className="flex flex-col items-center gap-3 bg-transparent">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 ${iconColor} transition-all duration-300 z-10`}>
                      {step.state === 'pending' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs ${textColor}`}>{step.label}</span>
                      {step.state === 'pending' && <Loader2 className="h-3 w-3 text-zinc-900 animate-spin" />}
                      {step.state === 'success' && <CheckCircle2 className="h-3 w-3 text-zinc-900" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ListCertificates() {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Issued Certificates</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">View all certificates issued by your university</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full">
                    <div className="h-6 w-1/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-transparent shadow-none">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <FileUp className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No certificates issued yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Start by issuing your first certificate using the "Issue New" link in the navigation bar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{cert.degreeName}</CardTitle>
                    <CardDescription className="mt-1">
                      Credential No: <span className="font-mono text-zinc-700 dark:text-zinc-300">{cert.credentialNo}</span>
                    </CardDescription>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {cert.graduationYear}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Student</span>
                      <span className="font-medium">{cert.student?.name} ({cert.student?.regNo})</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Status</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="capitalize font-medium">{cert.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">File Hash</span>
                      <code className="text-[10px] font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">{cert.fileHash.slice(0, 12)}...</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">IPFS CID</span>
                      <code className="text-[10px] font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">{cert.ipfsCID ? cert.ipfsCID.slice(0, 12) + '...' : 'Pending'}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Blockchain</span>
                      {cert.blockchainTx ? (
                        <a href={`https://sepolia.etherscan.io/tx/${cert.blockchainTx}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline">
                          {cert.blockchainTx.slice(0, 12)}...
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UniversityDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-zinc-200/50 dark:bg-grid-zinc-800/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-1 container pt-28 pb-12">
          <Routes>
            <Route path="/" element={<IssueCertificate />} />
            <Route path="/list" element={<ListCertificates />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
