import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';
import { validateRequestBody } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', assignmentController.list.bind(assignmentController));

router.get('/:id', assignmentController.getById.bind(assignmentController));

router.post(
  '/',
  requireInstructor,
  validateRequestBody([
    'configurationId',
    'studentId',
    'name',
    'description',
    'assignmentType',
    'availableFrom',
    'availableUntil',
    'deadline',
  ]),
  assignmentController.create.bind(assignmentController)
);

router.post(
  '/bulk',
  requireInstructor,
  validateRequestBody([
    'configurationId',
    'studentIds',
    'name',
    'description',
    'assignmentType',
    'availableFrom',
    'availableUntil',
    'deadline',
  ]),
  assignmentController.createBulk.bind(assignmentController)
);

router.put('/:id', requireInstructor, assignmentController.update.bind(assignmentController));

router.delete('/:id', requireInstructor, assignmentController.delete.bind(assignmentController));

router.get(
  '/student/:studentId',
  requireInstructor,
  assignmentController.getByStudent.bind(assignmentController)
);

export default router;
