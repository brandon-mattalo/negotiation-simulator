import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequestBody } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post(
  '/start',
  validateRequestBody(['configurationId']),
  sessionController.start.bind(sessionController)
);

router.get('/', sessionController.list.bind(sessionController));

router.get('/active', sessionController.getActive.bind(sessionController));

router.get('/:id', sessionController.getById.bind(sessionController));

router.post(
  '/:id/message',
  validateRequestBody(['message']),
  sessionController.sendMessage.bind(sessionController)
);

router.post('/:id/end', sessionController.end.bind(sessionController));

router.post('/:id/cancel', sessionController.cancel.bind(sessionController));

export default router;
