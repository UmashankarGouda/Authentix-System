import { Router } from 'express';
import { signupUniversity, signupStudent, login, getUniversities } from '../controllers/auth.controller';

const router = Router();

router.get('/universities', getUniversities);
router.post('/signup/university', signupUniversity);
router.post('/signup/student', signupStudent);
router.post('/login', login);

export default router;
