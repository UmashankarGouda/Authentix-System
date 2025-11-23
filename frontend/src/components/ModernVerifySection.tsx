import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { certificateAPI, VerificationResult } from '@/lib/api';
import { readFileAsArrayBuffer, sha256Bytes32, hashCanonicalJSON } from '@/lib/crypto';
import { cn } from '@/lib/utils';

interface FileVerifyForm {
  file: FileList;
}

interface MetadataVerifyForm {
  credentialNo: string;
  degreeName: string;
  graduationYear: string;
  studentEmail: string;
}

export default function ModernVerifySection() {
  const [activeTab, setActiveTab] = useState<'file' | 'metadata'>('file');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileForm = useForm<FileVerifyForm>();
  const metadataForm = useForm<MetadataVerifyForm>();

  const onFileVerify = async (data: FileVerifyForm) => {
    if (!data.file || data.file.length === 0) {
      toast.error('Please select a file');
      return;
    }
    verifyFile(data.file[0]);
  };

  const verifyFile = async (file: File) => {
    setIsLoading(true);
    setResult(null);

    try {
      const fileBuffer = await readFileAsArrayBuffer(file);
      const fileHash = await sha256Bytes32(fileBuffer);

      const verificationResult = await certificateAPI.verifyByFile(fileHash);
      setResult(verificationResult);

      if (verificationResult.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error(verificationResult.message || 'Certificate verification failed');
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
        toast.error(verificationResult.message || 'Certificate verification failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setResult({ valid: false, message: 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        fileForm.setValue('file', e.dataTransfer.files);
        verifyFile(file);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12">

            {/* Left Side: Input Area */}
            <div className="flex-1 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Verify Credential
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Check the authenticity of a certificate by uploading the file or entering details.
                </p>
              </div>

              {/* Custom Tabs */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab('file')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    activeTab === 'file'
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setActiveTab('metadata')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    activeTab === 'metadata'
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Metadata
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'file' ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={fileForm.handleSubmit(onFileVerify)} className="space-y-4">
                      <div
                        className={cn(
                          "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer group",
                          dragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          {...fileForm.register('file')}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              verifyFile(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:scale-110 transition-transform duration-200">
                            <Upload className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              PDF (max 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="metadata"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={metadataForm.handleSubmit(onMetadataVerify)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Credential No</label>
                          <input
                            {...metadataForm.register('credentialNo', { required: true })}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. CERT-123"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Graduation Year</label>
                          <input
                            type="number"
                            {...metadataForm.register('graduationYear', { required: true })}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. 2024"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Degree Name</label>
                          <input
                            {...metadataForm.register('degreeName', { required: true })}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Bachelor of Science in Computer Science"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Student Email</label>
                          <input
                            type="email"
                            {...metadataForm.register('studentEmail', { required: true })}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="student@university.edu"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Verify Certificate
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side: Result Area */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 pt-8 md:pt-0 md:pl-12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
                    <p className="text-sm text-zinc-500">Verifying on blockchain...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-6 rounded-2xl text-center space-y-4",
                      result.valid ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                      result.valid ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                    )}>
                      {result.valid ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-bold text-lg",
                        result.valid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                      )}>
                        {result.valid ? "Valid Certificate" : "Invalid Certificate"}
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {result.message}
                      </p>
                    </div>

                    {result.valid && result.credential && (
                      <div className="text-left text-sm pt-6 border-t border-green-200 dark:border-green-800/50">
                        <div className="grid grid-cols-[80px_1fr] gap-y-3 gap-x-4">
                          <span className="text-zinc-500">Degree:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.credential.degreeName}</span>

                          <span className="text-zinc-500">Student:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.credential.student?.name}</span>

                          <span className="text-zinc-500">Issuer:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.credential.university?.name}</span>
                        </div>

                        <a
                          href={`https://sepolia.etherscan.io/tx/${result.credential.blockchainTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-blue-600 hover:underline mt-6 text-xs"
                        >
                          View on Blockchain
                        </a>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500">
                      Result will appear here after verification
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
