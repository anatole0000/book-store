import { Router } from 'express';
import {
  createReview,
  getReviewsByBook,
  updateReview,
  deleteReview,
} from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Ai đã đăng nhập cũng có thể tạo review
router.post('/', authMiddleware, createReview);

// Public: xem review theo book
router.get('/book/:bookId', getReviewsByBook);

// Update review (chỉ owner hoặc admin)
router.put('/:id', authMiddleware, updateReview);

// Delete review (chỉ owner hoặc admin)
router.delete('/:id', authMiddleware, deleteReview);

export default router;
