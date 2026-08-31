import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'EAM Dashboard Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
