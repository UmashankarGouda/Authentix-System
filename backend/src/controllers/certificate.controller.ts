import { Response } from 'express';
import { AuthRequest, IssueCertificateDTO } from '../types';
import prisma from '../utils/prisma';
import { uploadToFilebase } from '../services/filebase.service';
import { issueCredentialOnChain, verifyCredentialOnChain } from '../services/blockchain.service';

export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    // Parse metadata from form data
    const metadata = JSON.parse(req.body.metadata || '{}');
    const encryptedShares = JSON.parse(req.body.encryptedShares || '[]');
    
    const {
      credentialNo,
      degreeName,
      graduationYear,
      studentEmail,
    } = metadata;
    
    const fileHash = req.body.fileHash;
    const jsonHash = req.body.jsonHash;
    const iv = req.body.iv;
    const authTag = req.body.authTag;

    const universityId = req.user!.id;
    
    // Find student by email
    const student = await prisma.student.findFirst({
      where: { email: studentEmail }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found with this email' });
    }
    
    const studentId = student.id;

    // Get file from request (multer will put it in req.file)
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload encrypted file to IPFS
    const fileBuffer = file.buffer;
    const cid = await uploadToFilebase(fileBuffer, `cert-${credentialNo}`);

    // Issue on blockchain
    const blockchainTx = await issueCredentialOnChain(fileHash, jsonHash, cid);

    // Store in database (include related student/university for richer response)
    const credential = await prisma.credential.create({
      data: {
        credentialNo,
        studentId,
        universityId,
        degreeName,
        graduationYear,
        ipfsCID: cid,
        fileHash,
        jsonHash,
        iv,
        authTag,
        blockchainTx,
        status: 'issued',
      },
      include: {
        student: {
          select: {
            name: true,
            regNo: true,
          },
        },
        university: {
          select: {
            name: true,
          },
        },
      },
    });

    // Store encrypted shares (best-effort; log errors but don't fail issuance)
    try {
      for (const share of encryptedShares) {
        await prisma.credentialCustodianMapping.create({
          data: {
            credentialId: credential.id,
            custodianId: share.custodianId,
            encryptedShare: share.encryptedShare,
          },
        });
      }
    } catch (err) {
      console.error('Error storing encrypted custodian shares:', err);
    }

    // Log audit (also best-effort)
    try {
      await prisma.auditLog.create({
        data: {
          credentialId: credential.id,
          eventType: 'issued',
          actorId: universityId,
          actorType: 'university',
        },
      });
    } catch (err) {
      console.error('Error creating audit log for issuance:', err);
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      credential,
    });
  } catch (error: any) {
    console.error('Error issuing certificate:', error);

    // Handle Prisma unique constraint on credentialNo explicitly
    if (error.code === 'P2002' && error.meta?.target?.includes('credentialNo')) {
      return res.status(409).json({
        message: 'A credential with this Credential Number already exists. Please use a unique Credential Number.',
      });
    }

    res.status(500).json({ message: error.message || 'Failed to issue certificate' });
  }
};

export const verifyCertificate = async (req: any, res: Response) => {
  try {
    const { fileHash, jsonHash } = req.query;
    
    console.log('🔍 Verification request:');
    console.log('  fileHash:', fileHash);
    console.log('  jsonHash:', jsonHash);

    const result = await verifyCredentialOnChain(fileHash, jsonHash);
    console.log('  Blockchain result:', result ? 'Found' : 'Not found');
    
    if (!result) {
      return res.status(404).json({ valid: false, message: 'Certificate not found on blockchain' });
    }

    // Find in database for additional info
    const credential = await prisma.credential.findFirst({
      where: { OR: [{ fileHash }, { jsonHash }] },
      include: { student: true, university: true },
    });
    console.log('  Database result:', credential ? 'Found' : 'Not found');

    if (!credential) {
      return res.json({
        valid: true,
        message: 'Credential found on blockchain but not in off-chain records',
        credential: null,
      });
    }

    res.json({
      valid: true,
      message: 'Certificate verified successfully',
      credential,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;

    let credentials;
    if (role === 'university') {
      credentials = await prisma.credential.findMany({
        where: { universityId: userId },
        include: { student: { select: { name: true, email: true } } },
      });
    } else {
      credentials = await prisma.credential.findMany({
        where: { studentId: userId },
        include: { university: { select: { name: true } } },
      });
    }

    res.json({ credentials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
