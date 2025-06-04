// import { Request, Response, NextFunction } from 'express';
import Book from '../models/book.model';
import logger from '../utils/logger';
import { bookQueue } from '../queues/book.queue';
import { CreateBookSchema, UpdateBookSchema } from '../validators/book.validator';
import { catchAsync } from '../utils/catchAsync';
import { CustomError } from '../middlewares/errorHandler';
import { getPagination } from '../utils/pagination';
import { isValidObjectId } from '../utils/validateObjectId';
import { imageQueue } from '../queues/image.queue';

// Tạo mới sách
export const createBook = catchAsync(async (req, res, next) => {
  const user = req.user as { _id: string; role?: string };

  if (user.role !== 'admin') return next(new CustomError('Forbidden: only admin can create books', 403));

  const price = parseNumberField(req.body.price);
  const stock = parseNumberField(req.body.stock);
  
  // Gộp data body và đường dẫn ảnh nếu có upload
  const data = { 
    ...req.body,
    price,
    stock,
  };
  if (req.file) {
    data.image = req.file.path;

    // Thêm job resize ảnh vào queue
    await imageQueue.add('resizeImage', { imagePath: req.file.path });
  }

  const result = CreateBookSchema.safeParse(data);
  if (!result.success) return next(new CustomError('Invalid input', 400, result.error.flatten()));

  const book = await new Book(data).save();

  await bookQueue.add('sendNewBookEmail', {
    bookId: book._id,
    adminId: user._id,
    bookTitle: book.title,
  });

  logger.info(`Book ${book._id} created by admin ${user._id}.`);
  res.status(201).json(book);
});

// Lấy danh sách sách (có thể tìm kiếm + lọc category)
export const getBooks = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { q, category } = req.query;

  const filters: any = { status: 'in_stock', isAvailable: true };

  if (q) {
    const regex = new RegExp((q as string).trim(), 'i');
    filters.$or = [{ title: regex }, { author: regex }, { category: regex }];
  }

  if (category) filters.category = (category as string).trim();

  const totalBooks = await Book.countDocuments(filters);
  const books = await Book.find(filters).skip(skip).limit(limit);

  res.json({ page, limit, totalBooks, totalPages: Math.ceil(totalBooks / limit), books });
});

// Lấy sách theo ID
export const getBookById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new CustomError('Invalid book ID', 400));

  const book = await Book.findById(id);
  if (!book) return next(new CustomError('Book not found', 404));

  res.json(book);
});

// Cập nhật sách
export const updateBook = catchAsync(async (req, res, next) => {
  const user = req.user as { _id: string; role?: string };
  if (user.role !== 'admin') return next(new CustomError('Forbidden: only admin can update books', 403));

  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new CustomError('Invalid book ID', 400));
  
  const price = parseNumberField(req.body.price);
  const stock = parseNumberField(req.body.stock);

  const data = {
    ...req.body,
    ...(price !== undefined && { price }),
    ...(stock !== undefined && { stock }),
  };
  if (req.file) {
    data.image = req.file.path;
    await imageQueue.add('resizeImage', { imagePath: req.file.path });
  }


  const result = UpdateBookSchema.safeParse(data);
  if (!result.success) return next(new CustomError('Invalid input', 400, result.error.flatten()));

  const book = await Book.findByIdAndUpdate(id, data, { new: true });
  if (!book) return next(new CustomError('Book not found', 404));

  logger.info(`Book ${book._id} updated by admin ${user._id}`);
  res.json(book);
});

// Xóa sách
export const deleteBook = catchAsync(async (req, res, next) => {
  const user = req.user as { _id: string; role?: string };
  if (user.role !== 'admin') return next(new CustomError('Forbidden: only admin can delete books', 403));

  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new CustomError('Invalid book ID', 400));

  const book = await Book.findByIdAndDelete(id);
  if (!book) return next(new CustomError('Book not found', 404));

  logger.info(`Book ${book._id} deleted by admin ${user._id}`);
  res.json({ msg: 'Deleted successfully' });
});

// Cập nhật trạng thái sách
export const updateBookStatus = catchAsync(async (req, res, next) => {
  const { status, isAvailable } = req.body;
  const { id } = req.params;

  if (!isValidObjectId(id)) return next(new CustomError('Invalid book ID', 400));

  const allowedStatuses = ['in_stock', 'out_of_stock', 'discontinued'];
  const updateData: Record<string, any> = {};

  if (status && allowedStatuses.includes(status)) updateData.status = status;
  if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;

  if (Object.keys(updateData).length === 0)
    return next(new CustomError('No valid status fields provided', 400));

  const book = await Book.findByIdAndUpdate(id, updateData, { new: true });
  if (!book) return next(new CustomError('Book not found', 404));

  res.json({ msg: 'Book status updated successfully', book });
});
function parseNumberField(value: any): number | undefined {
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}


