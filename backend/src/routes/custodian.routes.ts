import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const custodians = await prisma.custodian.findMany({
      select: { id: true, name: true, publicKey: true, endpoint: true },
    });
    res.json({ custodians });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
