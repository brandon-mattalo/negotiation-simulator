import { Router } from 'express';
import { instructorController } from '../controllers/instructor.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication and instructor role
router.use(authenticateToken);
router.use(requireInstructor);

router.get('/sessions', instructorController.getStudentSessions.bind(instructorController));

router.get('/sessions/:id', instructorController.getSessionById.bind(instructorController));

router.get('/students', instructorController.getStudents.bind(instructorController));

export default router;
