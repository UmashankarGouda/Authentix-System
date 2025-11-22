import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileUp, List } from 'lucide-react';
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
  state: StepState;
}

function IssueCertificate() {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<IssuanceStep[]>([
    { key: 'prepare', label: 'Encrypt & prepare certificate', state: 'idle' },
    { key: 'ipfs', label: 'Upload encrypted file to IPFS', state: 'idle' },
    { key: 'blockchain', label: 'Record credential on blockchain', state: 'idle' },
    { key: 'db', label: 'Save credential in database', state: 'idle' },
  ]);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<IssueForm>();

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Issue Certificate</h2>
        <p className="text-muted-foreground">Upload and encrypt a new certificate</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Details</CardTitle>
          <CardDescription>Fill in the details and upload the PDF certificate</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Student Email</Label>
              <Input
                id="studentEmail"
                type="email"
                {...register('studentEmail', { required: 'Required' })}
              />
              {errors.studentEmail && <p className="text-sm text-destructive">{errors.studentEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialNo">Credential Number</Label>
              <Input
                id="credentialNo"
                {...register('credentialNo', { required: 'Required' })}
              />
              {errors.credentialNo && <p className="text-sm text-destructive">{errors.credentialNo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="degreeName">Degree Name</Label>
              <Input
                id="degreeName"
                {...register('degreeName', { required: 'Required' })}
              />
              {errors.degreeName && <p className="text-sm text-destructive">{errors.degreeName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input
                id="graduationYear"
                type="number"
                {...register('graduationYear', { required: 'Required' })}
              />
              {errors.graduationYear && <p className="text-sm text-destructive">{errors.graduationYear.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Certificate PDF</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                {...register('file', { required: 'File is required' })}
              />
              {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </form>

          {/* Issuance status steps */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Issuance status</p>
            <ul className="space-y-1 text-xs">
              {steps.map((step) => {
                const color =
                  step.state === 'success'
                    ? 'bg-emerald-500'
                    : step.state === 'pending'
                    ? 'bg-amber-500'
                    : step.state === 'error'
                    ? 'bg-red-500'
                    : 'bg-muted-foreground/40';
                const label =
                  step.state === 'success'
                    ? 'Done'
                    : step.state === 'pending'
                    ? 'In progress'
                    : step.state === 'error'
                    ? 'Error'
                    : 'Waiting';

                return (
                  <li key={step.key} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span>{step.label}</span>
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground tracking-wide">
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custodians ({custodians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {custodians.map((c) => (
              <div key={c.id} className="p-3 border rounded">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">ID: {c.id}</p>
              </div>
            ))}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Issued Certificates</h2>
        <p className="text-muted-foreground">View all certificates issued by your university</p>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No certificates issued yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle>{cert.degreeName}</CardTitle>
                <CardDescription>
                  Credential No: {cert.credentialNo} | Year: {cert.graduationYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Student:</strong> {cert.student?.name} ({cert.student?.regNo})</p>
                  <p><strong>File Hash:</strong> <code className="text-xs">{cert.fileHash.slice(0, 20)}...</code></p>
                  <p><strong>JSON Hash:</strong> <code className="text-xs">{cert.jsonHash.slice(0, 20)}...</code></p>
                  <p><strong>IPFS CID:</strong> <code className="text-xs">{cert.ipfsCID}</code></p>
                  <p><strong>Blockchain TX:</strong> <a href={`https://sepolia.etherscan.io/tx/${cert.blockchainTx}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{cert.blockchainTx?.slice(0, 20)}...</a></p>
                  <p><strong>Status:</strong> <span className="capitalize">{cert.status}</span></p>
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
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container pt-20 pb-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-2">
            <Link to="/university">
              <Button
                variant={location.pathname === '/university' ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Issue Certificate
              </Button>
            </Link>
            <Link to="/university/list">
              <Button
                variant={location.pathname === '/university/list' ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                <List className="mr-2 h-4 w-4" />
                View Certificates
              </Button>
            </Link>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<IssueCertificate />} />
              <Route path="/list" element={<ListCertificates />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
