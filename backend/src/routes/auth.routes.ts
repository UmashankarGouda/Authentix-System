import { Router } from 'express';
import { signupUniversity, signupStudent, login } from '../controllers/auth.controller';

const router = Router();

router.post('/signup/university', signupUniversity);
router.post('/signup/student', signupStudent);
router.post('/login', login);

export default router;
