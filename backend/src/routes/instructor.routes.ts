import { Router } from 'express';
import { instructorController } from '../controllers/instructor.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireInstructor, requireAdmin } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication and instructor role
router.use(authenticateToken);
router.use(requireInstructor);

router.get('/sessions', instructorController.getStudentSessions.bind(instructorController));

router.get('/sessions/:id', instructorController.getSessionById.bind(instructorController));

router.get('/students', instructorController.getStudents.bind(instructorController));

router.delete('/enroll/:studentId', instructorController.unenrollStudent.bind(instructorController));

router.post('/create-student', instructorController.createStudent.bind(instructorController));

router.get('/students/:studentId/password', instructorController.getStudentPassword.bind(instructorController));

router.get('/students/export', instructorController.exportStudentCredentials.bind(instructorController));

// Admin-only: manage other instructor accounts
router.get('/instructors', requireAdmin, instructorController.listInstructors.bind(instructorController));

router.post('/instructors', requireAdmin, instructorController.createInstructor.bind(instructorController));

router.get('/instructors/:id/password', requireAdmin, instructorController.getInstructorPassword.bind(instructorController));

router.post('/instructors/:id/deactivate', requireAdmin, instructorController.deactivateInstructor.bind(instructorController));

router.post('/instructors/:id/reactivate', requireAdmin, instructorController.reactivateInstructor.bind(instructorController));

export default router;
