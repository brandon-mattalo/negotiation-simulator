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

router.get('/unenrolled-students', instructorController.getUnenrolledStudents.bind(instructorController));

router.post('/enroll', instructorController.enrollStudent.bind(instructorController));

router.delete('/enroll/:studentId', instructorController.unenrollStudent.bind(instructorController));

router.post('/create-student', instructorController.createStudent.bind(instructorController));

router.get('/students/:studentId/password', instructorController.getStudentPassword.bind(instructorController));

router.get('/students/export', instructorController.exportStudentCredentials.bind(instructorController));

export default router;
