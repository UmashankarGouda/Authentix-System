import { Router } from 'express';
import multer from 'multer';
import { issueCertificate, verifyCertificate, getCertificates } from '../controllers/certificate.controller';
import { authenticate, isUniversity } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/issue', authenticate, isUniversity, upload.single('file'), issueCertificate);
router.get('/verify', verifyCertificate); // Public endpoint
router.get('/list', authenticate, getCertificates);

export default router;
