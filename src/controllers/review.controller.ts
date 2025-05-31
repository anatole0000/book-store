// controllers/review.controller.ts
import { Request, Response } from 'express';
import Review from '../models/review.model';

export const createReview = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { _id: string; role?: string };
  const { book, rating, comment } = req.body;

  if (!book || typeof book !== 'string') {
    res.status(400).json({ msg: 'Book ID is required and must be a string' });
    return;
  }

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ msg: 'Rating is required and must be a number between 1 and 5' });
    return;
  }

  if (comment && typeof comment !== 'string') {
    res.status(400).json({ msg: 'Comment must be a string' });
    return;
  }

  try {
    const existingReview = await Review.findOne({ user: user._id, book });
    if (existingReview) {
      res.status(400).json({ msg: 'You have already reviewed this book' });
      return;
    }

    const review = new Review({
      user: user._id,
      book,
      rating,
      comment,
      createdAt: new Date(),
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ msg: 'Create review failed', error: err });
  }
};

export const getReviewsByBook = async (req: Request, res: Response): Promise<void> => {
  const { bookId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  try {
    const reviews = await Review.find({ book: bookId })
      .populate('user', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ book: bookId });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Get reviews failed', error: err });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { _id: string; role?: string };
  const { rating, comment } = req.body;
  const reviewId = req.params.id;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ msg: 'Review not found' });
      return;
    }

    if (review.user.toString() !== user._id && user.role !== 'admin') {
      res.status(403).json({ msg: 'Forbidden' });
      return;
    }

    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({ msg: 'Rating must be a number between 1 and 5' });
        return;
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string') {
        res.status(400).json({ msg: 'Comment must be a string' });
        return;
      }
      review.comment = comment;
    }

    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ msg: 'Update review failed', error: err });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { _id: string; role?: string };
  const reviewId = req.params.id;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ msg: 'Review not found' });
      return;
    }

    if (review.user.toString() !== user._id && user.role !== 'admin') {
      res.status(403).json({ msg: 'Forbidden' });
      return;
    }

    await review.deleteOne();
    res.json({ msg: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Delete review failed', error: err });
  }
};
