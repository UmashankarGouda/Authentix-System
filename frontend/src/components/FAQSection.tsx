import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Shield, Lock, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
    {
        id: '1',
        question: 'How does blockchain verification work?',
        answer: 'When a certificate is issued, a cryptographic hash of the file is stored on the Ethereum Sepolia blockchain. This creates an immutable record that cannot be altered. When you verify a file, we calculate its hash and compare it with the blockchain record to ensure it hasn\'t been tampered with.',
        icon: FileCheck
    },
    {
        id: '2',
        question: 'Is my personal data visible on the blockchain?',
        answer: 'No. Only the cryptographic hash of your certificate is stored on the blockchain. This hash is a one-way mathematical function that cannot be reversed to reveal your personal information. Your actual data remains encrypted and stored securely off-chain.',
        icon: Lock
    },
    {
        id: '3',
        question: 'What happens if the university system goes down?',
        answer: 'Our system uses decentralized storage (IPFS) and Shamir\'s Secret Sharing. This means your certificate is stored across a distributed network, and the keys to decrypt it are split among multiple independent custodians. You can recover your certificate even if the university\'s servers are offline.',
        icon: Shield
    },
    {
        id: '4',
        question: 'Can I verify a printed copy?',
        answer: 'This system is designed for digital verification. You need the original digital PDF file to verify its authenticity against the blockchain record. However, the metadata verification option allows you to verify using the certificate details if you don\'t have the file handy.',
        icon: HelpCircle
    }
];

export default function FAQSection() {
    const [openId, setOpenId] = useState<string | null>(null);

    return (
        <div className="w-full max-w-3xl mx-auto py-12" id="faq-section">
            <div className="text-center mb-12 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Frequently asked questions
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                    Everything you need to know about our secure, blockchain-based verification system.
                </p>
            </div>

            <div className="space-y-2">
                {faqs.map((faq) => (
                    <motion.div
                        key={faq.id}
                        initial={false}
                        className={cn(
                            "border rounded-2xl overflow-hidden transition-colors duration-200",
                            openId === faq.id
                                ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm"
                                : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                    >
                        <button
                            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                            className="flex items-center justify-between w-full p-6 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    openId === faq.id ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                )}>
                                    <faq.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {faq.question}
                                </span>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "w-5 h-5 text-zinc-400 transition-transform duration-200",
                                    openId === faq.id && "transform rotate-180"
                                )}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {openId === faq.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="px-6 pb-6 pl-[4.5rem] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
