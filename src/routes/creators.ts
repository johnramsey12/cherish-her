import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

router.get('/verify/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code.toUpperCase();
    const creator = await prisma.creator.findUnique({
      where: { code },
      select: { name: true, handle: true, isActive: true },
    });
    if (!creator || !creator.isActive) {
      return res.json({ valid: false });
    }
    res.json({ valid: true, name: creator.name || creator.handle });
  } catch {
    res.json({ valid: false });
  }
});

router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { name, email, handle, platform, followerCount } = req.body;
    if (!name || !email || !handle) {
      return res.status(400).json({ error: 'Name, email and handle required' });
    }
    await prisma.creatorApplication.create({
      data: { name, email, handle, platform, followerCount: parseInt(followerCount) || 0 },
    });
    res.json({ success: true, message: 'Application received. We\'ll be in touch within 48 hours.' });
  } catch {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;