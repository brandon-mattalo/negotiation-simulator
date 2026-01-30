import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequestBody } from '../middleware/validation.middleware';

const router = Router();

router.post(
  '/register',
  validateRequestBody(['username', 'password', 'role']),
  authController.register.bind(authController)
);

router.post(
  '/login',
  validateRequestBody(['username', 'password']),
  authController.login.bind(authController)
);

router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

router.post('/logout', authenticateToken, authController.logout.bind(authController));

export default router;
