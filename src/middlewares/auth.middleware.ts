import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ msg: 'User not found' });
      return;
    }
    // Ép kiểu cho req.user để TS biết
    req.user = user as IUser;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ msg: 'Invalid token' });
  }
};
