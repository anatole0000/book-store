import { Request, Response, NextFunction } from 'express';
import Book from '../models/book.model';
import logger from '../utils/logger';
import { bookQueue } from '../queues/book.queue';
import { CreateBookSchema, UpdateBookSchema } from '../validators/book.validator';
import { catchAsync } from '../utils/catchAsync';
import { CustomError } from '../middlewares/errorHandler';

// Create Book
export const createBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role?: string };

  if (user.role !== 'admin') {
    const err: CustomError = new Error('Forbidden: only admin can create books');
    err.statusCode = 403;
    return next(err);
  }

  const result = CreateBookSchema.safeParse(req.body);
  if (!result.success) {
    const err: CustomError = new Error('Invalid input');
    err.statusCode = 400;
    err.details = result.error.flatten();
    return next(err);
  }

  const book = new Book(req.body);
  await book.save();

  logger.info(`Book ${book._id} created by admin ${user._id}.`);

  await bookQueue.add('sendNewBookEmail', {
    bookId: book._id,
    adminId: user._id,
    bookTitle: book.title,
  });

  res.status(201).json(book);
});

// Get all books with pagination
export const getBooks = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const totalBooks = await Book.countDocuments();
  const books = await Book.find().skip(skip).limit(limit);

  res.json({
    page,
    limit,
    totalBooks,
    totalPages: Math.ceil(totalBooks / limit),
    books,
  });
});

// Get single book by ID
export const getBookById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    const err: CustomError = new Error('Invalid book ID');
    err.statusCode = 400;
    return next(err);
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    const err: CustomError = new Error('Book not found');
    err.statusCode = 404;
    return next(err);
  }

  res.json(book);
});

// Update book
export const updateBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role?: string };

  if (user.role !== 'admin') {
    const err: CustomError = new Error('Forbidden: only admin can update books');
    err.statusCode = 403;
    return next(err);
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    const err: CustomError = new Error('Invalid book ID');
    err.statusCode = 400;
    return next(err);
  }

  const result = UpdateBookSchema.safeParse(req.body);
  if (!result.success) {
    const err: CustomError = new Error('Invalid input');
    err.statusCode = 400;
    err.details = result.error.flatten();
    return next(err);
  }

  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!book) {
    const err: CustomError = new Error('Book not found');
    err.statusCode = 404;
    return next(err);
  }

  logger.info(`Book ${book._id} updated by admin ${user._id}`);
  res.json(book);
});

// Delete book
export const deleteBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role?: string };

  if (user.role !== 'admin') {
    const err: CustomError = new Error('Forbidden: only admin can delete books');
    err.statusCode = 403;
    return next(err);
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    const err: CustomError = new Error('Invalid book ID');
    err.statusCode = 400;
    return next(err);
  }

  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    const err: CustomError = new Error('Book not found');
    err.statusCode = 404;
    return next(err);
  }

  logger.info(`Book ${book._id} deleted by admin ${user._id}`);
  res.json({ msg: 'Deleted successfully' });
});

// book.controller.ts
export const searchBooks = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();

  if (!q) {
    return res.status(400).json({ msg: 'Query parameter q is required' });
  }

  // Tạo regex tìm kiếm không phân biệt hoa thường
  const regex = new RegExp(q, 'i');

  // Tìm sách theo nhiều trường (title, author, category)
  const books = await Book.find({
    $or: [
      { title: regex },
      { author: regex },
      { category: regex }
    ],
    status: 'in_stock',
    isAvailable: true,
  });

  res.json({
    totalResults: books.length,
    books,
  });
});

// book.controller.ts
export const getBooksByCategory = catchAsync(async (req: Request, res: Response) => {
  const category = req.params.category.trim();
  if (!category) {
    return res.status(400).json({ msg: 'Category parameter is required' });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  // Đếm tổng sách theo category
  const totalBooks = await Book.countDocuments({
    category: category,
    status: 'in_stock',
    isAvailable: true,
  });

  // Lấy sách theo category với phân trang
  const books = await Book.find({
    category: category,
    status: 'in_stock',
    isAvailable: true,
  })
    .skip(skip)
    .limit(limit);

  res.json({
    page,
    limit,
    totalBooks,
    totalPages: Math.ceil(totalBooks / limit),
    books,
  });
});

export const updateBookStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status, isAvailable } = req.body;

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    const err: CustomError = new Error('Invalid book ID');
    err.statusCode = 400;
    return next(err);
  }

  const allowedStatuses = ['in_stock', 'out_of_stock', 'discontinued']; // Bạn có thể sửa theo hệ thống của bạn
  const updateData: Record<string, any> = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      const err: CustomError = new Error('Invalid status');
      err.statusCode = 400;
      return next(err);
    }
    updateData.status = status;
  }

  if (typeof isAvailable === 'boolean') {
    updateData.isAvailable = isAvailable;
  }

  if (Object.keys(updateData).length === 0) {
    const err: CustomError = new Error('No valid status fields provided');
    err.statusCode = 400;
    return next(err);
  }

  const book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });

  if (!book) {
    const err: CustomError = new Error('Book not found');
    err.statusCode = 404;
    return next(err);
  }

  res.json({ msg: 'Book status updated successfully', book });
});
