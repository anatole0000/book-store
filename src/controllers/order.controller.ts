import mongoose from 'mongoose';
import Book from '../models/book.model';
import Order from '../models/order.model';
import { Request, Response } from 'express';
import { emailQueue } from '../queues/email.queue';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user as { _id: string };
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ msg: 'Items are required' });
      return;
    }

    let total = 0;

    // Kiểm tra tồn kho và tính tổng
    for (const item of items) {
      // Chỉ kiểm tra quantity
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ msg: 'Invalid item quantity' });
        return;
      }

      const book = await Book.findById(item.book).session(session);
      if (!book) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ msg: `Book not found: ${item.book}` });
        return;
      }

      if (book.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ msg: `Not enough stock for book: ${book.title}` });
        return;
      }

      total += book.price * item.quantity;

      // Trừ tồn kho
      book.stock -= item.quantity;
      await book.save({ session });
    }

    // Tạo đơn hàng mới trong session
    const order = new Order({
      user: user._id,
      items,
      total,
      status: 'pending',
    });

    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    emailQueue.add('sendOrderConfirmation', {
      to: (req.user as any).email,  // đảm bảo req.user có email
      subject: 'Order Confirmation - Your order has been received',
      text: `Dear customer, your order #${order._id} totaling $${order.total} has been successfully received. Thank you for shopping with us!`,
      orderId: order._id.toString(),
      items: order.items,
      total: order.total,
    }).catch(err => {
      console.error(`Failed to enqueue order confirmation email for order ${order._id}:`, err);
    });

    res.status(201).json(order);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error(err);
    res.status(400).json({ msg: 'Create order failed', error: err });
  }
};



export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { _id: string; role: string };
  try {
    let orders;
    if (user.role === 'admin' || user.role === 'deliver') {
      orders = await Order.find().populate('user').populate('items.book');
    } else {
      orders = await Order.find({ user: user._id }).populate('items.book');
    }
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Get orders failed', error: err });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { role?: string };

  if (user.role !== 'admin' && user.role !== 'deliver') {
    res.status(403).json({ msg: 'Forbidden: only admin or deliver can update status' });
    return;
  }

  const { status } = req.body;
  if (!['pending', 'shipping', 'delivered'].includes(status)) {
    res.status(400).json({ msg: 'Invalid status' });
    return;
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({ msg: 'Invalid order ID' });
    return;
  }

  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      res.status(404).json({ msg: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Update failed', error: err });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({ msg: 'Invalid order ID' });
    return;
  }

  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('items.book');

    if (!order) {
      res.status(404).json({ msg: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err });
  }
};


export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { role?: string };

  if (user.role !== 'admin') {
    res.status(403).json({ msg: 'Forbidden: only admin can delete orders' });
    return;
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({ msg: 'Invalid order ID' });
    return;
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ msg: 'Order not found' });
      return;
    }

    res.json({ msg: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Delete failed', error: err });
  }
};

