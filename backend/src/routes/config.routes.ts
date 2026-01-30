import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';
import { validateRequestBody } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', configController.list.bind(configController));

router.get('/:id', configController.getById.bind(configController));

router.post(
  '/',
  requireInstructor,
  validateRequestBody([
    'name',
    'scenario',
    'studentGoals',
    'botGoals',
    'studentConstraints',
    'botConstraints',
    'botStrategy',
    'temperament',
    'difficulty',
    'timeLimit',
    'personality',
  ]),
  configController.create.bind(configController)
);

router.put('/:id', requireInstructor, configController.update.bind(configController));

router.delete('/:id', requireInstructor, configController.delete.bind(configController));

router.post('/:id/activate', requireInstructor, configController.activate.bind(configController));

export default router;
