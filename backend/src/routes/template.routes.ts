import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', templateController.list.bind(templateController));

router.get('/:id', templateController.getById.bind(templateController));

router.post(
  '/:id/use',
  requireInstructor,
  templateController.useTemplate.bind(templateController)
);

export default router;
