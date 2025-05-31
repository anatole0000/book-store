import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        msg: 'Invalid input',
        errors: result.error.flatten(),
      });
      return;  // important: chỉ dừng middleware ở đây, không trả về giá trị
    }
    req.body = result.data;
    next();
  };
