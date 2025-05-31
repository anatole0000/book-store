import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import logger from '../utils/logger';
import { emailQueue } from '../queues/email.queue';

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn(`Register attempt with existing email: ${email} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
      res.status(400).json({ msg: 'Email already exists' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, name });
    await user.save();

    // Gửi email bất đồng bộ, không chờ đợi
    emailQueue.add('sendWelcomeEmail', {
      to: email,
      subject: 'Welcome to our Book App',
      text: `Hello ${name}, welcome aboard!`,
    }).catch(err => {
      logger.error(`Failed to enqueue welcome email for user ${user._id}: ${err.message}`);
    });

    logger.info(`New user registered: ${user._id} (${email}) - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
    res.status(201).json({ msg: 'User registered' });
  } catch (err: any) {
    logger.error(`Register failed for email ${req.body?.email}: ${err.message} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
    res.status(500).json({ msg: 'Registration failed', error: err });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      logger.warn(`Failed login attempt for email: ${email} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
      res.status(400).json({ msg: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(`Failed login attempt (wrong password) for email: ${email} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
      res.status(400).json({ msg: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true }).json({ msg: 'Logged in' });
    logger.info(`User logged in: ${user._id} (${email}) - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
  } catch (err: any) {
    logger.error(`Login error for email ${req.body?.email}: ${err.message} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
    res.status(500).json({ msg: 'Login failed', error: err });
  }
};


export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token').json({ msg: 'Logged out' });
};

export const profile = async (req: Request, res: Response): Promise<void> => {
  res.json(req.user);
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  try {
    const userId = (req.user as any)._id;
    await User.findByIdAndDelete(typeof userId === 'string' ? userId : userId.toString());
    logger.info(`User account deleted: ${userId}`);
    res.clearCookie('token').json({ msg: 'Account deleted' });
  } catch (err: any) {
    const userId = (req.user as any)?._id ?? 'unknown';
    logger.error(`Delete account failed for user ${userId}: ${err.message}`);
    res.status(500).json({ msg: 'Delete account failed', error: err });
  }
};






