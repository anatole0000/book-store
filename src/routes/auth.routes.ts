import { Router } from 'express';
import passport from 'passport';
import { register, login, logout, profile, deleteAccount } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { registerValidation, loginValidation } from '../validation/auth.validation';
import { validateRequest } from '../middlewares/validateRequest';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, loginRateLimiter,  login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, profile);
router.delete('/delete', authMiddleware, deleteAccount);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/login-failure',
    successRedirect: '/auth/login-success',
  })
);

router.get('/login-success', (req, res) => {
  res.send('Login with Google successful');
});

router.get('/login-failure', (req, res) => {
  res.send('Login with Google failed');
});

export default router;

