import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';
import { certificateAPI, VerificationResult } from '@/lib/api';
import { readFileAsArrayBuffer, sha256Bytes32, hashCanonicalJSON } from '@/lib/crypto';

interface FileVerifyForm {
  file: FileList;
}

interface MetadataVerifyForm {
  credentialNo: string;
  degreeName: string;
  graduationYear: string;
  studentEmail: string;
}

export default function Verifier() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileForm = useForm<FileVerifyForm>();
  const metadataForm = useForm<MetadataVerifyForm>();

  const onFileVerify = async (data: FileVerifyForm) => {
    if (!data.file || data.file.length === 0) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const file = data.file[0];
      const fileBuffer = await readFileAsArrayBuffer(file);
      const fileHash = await sha256Bytes32(fileBuffer);

      const verificationResult = await certificateAPI.verifyByFile(fileHash);
      setResult(verificationResult);

      if (verificationResult.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate verification failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setResult({ valid: false, message: 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const onMetadataVerify = async (data: MetadataVerifyForm) => {
    setIsLoading(true);
    setResult(null);

    try {
      const metadata = {
        credentialNo: data.credentialNo,
        degreeName: data.degreeName,
        graduationYear: parseInt(data.graduationYear),
        studentEmail: data.studentEmail,
      };

      const jsonHash = await hashCanonicalJSON(metadata);
      const verificationResult = await certificateAPI.verifyByMetadata(jsonHash);
      setResult(verificationResult);

      if (verificationResult.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate verification failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setResult({ valid: false, message: 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Verify Certificate</h1>
            <p className="text-lg text-muted-foreground">
              Verify the authenticity of academic credentials on the blockchain
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verification Method</CardTitle>
              <CardDescription>
                Choose to verify by uploading the certificate file or entering metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                {/* File Verification */}
                <TabsContent value="file">
                  <form onSubmit={fileForm.handleSubmit(onFileVerify)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verify-file">Upload Certificate PDF</Label>
                      <Input
                        id="verify-file"
                        type="file"
                        accept=".pdf"
                        {...fileForm.register('file', { required: 'File is required' })}
                      />
                      {fileForm.formState.errors.file && (
                        <p className="text-sm text-destructive">{fileForm.formState.errors.file.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Upload the encrypted certificate file to verify its authenticity
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Certificate'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Metadata Verification */}
                <TabsContent value="metadata">
                  <form onSubmit={metadataForm.handleSubmit(onMetadataVerify)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-credentialNo">Credential Number</Label>
                      <Input
                        id="meta-credentialNo"
                        {...metadataForm.register('credentialNo', { required: 'Required' })}
                      />
                      {metadataForm.formState.errors.credentialNo && (
                        <p className="text-sm text-destructive">{metadataForm.formState.errors.credentialNo.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta-degreeName">Degree Name</Label>
                      <Input
                        id="meta-degreeName"
                        {...metadataForm.register('degreeName', { required: 'Required' })}
                      />
                      {metadataForm.formState.errors.degreeName && (
                        <p className="text-sm text-destructive">{metadataForm.formState.errors.degreeName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta-graduationYear">Graduation Year</Label>
                      <Input
                        id="meta-graduationYear"
                        type="number"
                        {...metadataForm.register('graduationYear', { required: 'Required' })}
                      />
                      {metadataForm.formState.errors.graduationYear && (
                        <p className="text-sm text-destructive">{metadataForm.formState.errors.graduationYear.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta-studentEmail">Student Email</Label>
                      <Input
                        id="meta-studentEmail"
                        type="email"
                        {...metadataForm.register('studentEmail', { required: 'Required' })}
                      />
                      {metadataForm.formState.errors.studentEmail && (
                        <p className="text-sm text-destructive">{metadataForm.formState.errors.studentEmail.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Certificate'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {result && (
            <Card className={result.valid ? 'border-green-600 dark:border-green-500' : 'border-red-600 dark:border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.valid ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                      Verification Successful
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
                      Verification Failed
                    </>
                  )}
                </CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              {result.valid && result.credential && (
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Degree:</strong> {result.credential.degreeName}</p>
                    <p><strong>Credential No:</strong> {result.credential.credentialNo}</p>
                    <p><strong>Graduation Year:</strong> {result.credential.graduationYear}</p>
                    <p><strong>University:</strong> {result.credential.university?.name}</p>
                    <p><strong>Student:</strong> {result.credential.student?.name}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{result.credential.status}</span></p>
                    <p>
                      <strong>Blockchain TX:</strong>{' '}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.credential.blockchainTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View on Etherscan →
                      </a>
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
