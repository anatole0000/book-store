import { z } from 'zod';

export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  description: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  category: z.string().optional(),
});

export const UpdateBookSchema = CreateBookSchema.partial(); // Cho phép update 1 phần
