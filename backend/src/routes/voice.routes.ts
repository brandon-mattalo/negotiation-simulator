import { Router, json } from 'express';
import { voiceController } from '../controllers/voice.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/tts', voiceController.tts.bind(voiceController));
// STT receives base64-encoded audio in the JSON body — override the default
// 100KB limit on this route only.  10 MB covers several minutes of audio.
router.post('/stt', json({ limit: '10mb' }), voiceController.stt.bind(voiceController));

export default router;
