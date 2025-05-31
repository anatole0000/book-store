import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as { role?: string };
    if (!user || !roles.includes(user.role || '')) {
      res.status(403).json({ msg: 'Forbidden: insufficient permissions' });
      return;  // Dừng middleware, KHÔNG gọi next()
    }
    next();
  };
};
