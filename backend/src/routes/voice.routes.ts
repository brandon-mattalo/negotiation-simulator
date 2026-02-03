import { Router } from 'express';
import { voiceController } from '../controllers/voice.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/tts', voiceController.tts.bind(voiceController));
router.post('/stt', voiceController.stt.bind(voiceController));

export default router;
