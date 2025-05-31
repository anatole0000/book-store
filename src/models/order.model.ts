import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderItem {
  book: Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  status: 'pending' | 'shipping' | 'delivered';
  total: number;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    status: { type: String, enum: ['pending', 'shipping', 'delivered'], default: 'pending' },
    total: { type: Number, required: true },
  },
  { timestamps: true } // tự động createdAt và updatedAt
);


export default mongoose.model<IOrder>('Order', OrderSchema);
