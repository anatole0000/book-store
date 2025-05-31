import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  price: number;
  stock: number;
  description?: string;
  image?: string;
  category?: string;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  isAvailable: boolean;
  soldCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  isInStock: () => boolean;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, index: 'text' },
    author: { type: String, required: true, index: 'text' },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: String },

    // Trạng thái sản phẩm: còn hàng, hết hàng, ngừng kinh doanh
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'discontinued'],
      default: 'in_stock',
    },

    // Cờ cho biết sản phẩm có khả dụng hay không
    isAvailable: { type: Boolean, default: true },

    // Số lượng sản phẩm đã bán
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Phương thức kiểm tra còn hàng
BookSchema.methods.isInStock = function (): boolean {
  return this.stock > 0 && this.status === 'in_stock' && this.isAvailable;
};

// Tạo index text cho tìm kiếm nhanh
BookSchema.index({ title: 'text', author: 'text' });

// Hook trước khi lưu (save) - tự động cập nhật status
BookSchema.pre('save', function (next) {
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
  } else if (!this.isAvailable) {
    this.status = 'discontinued';
  } else {
    this.status = 'in_stock';
  }
  next();
});

// Hook trước khi cập nhật (findOneAndUpdate) - tự động cập nhật status
BookSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Ensure update is an object (not an aggregation pipeline)
  if (update && typeof update === 'object' && !Array.isArray(update)) {
    // Nếu cập nhật stock
    if ((update as any).stock !== undefined) {
      if ((update as any).stock <= 0) {
        (update as any).status = 'out_of_stock';
      } else if ((update as any).isAvailable === false) {
        (update as any).status = 'discontinued';
      } else {
        (update as any).status = 'in_stock';
      }
    }
    // Nếu cập nhật isAvailable mà không cập nhật stock
    if ((update as any).isAvailable !== undefined && (update as any).stock === undefined) {
      if ((update as any).isAvailable === false) {
        (update as any).status = 'discontinued';
      } else if ((this.getUpdate() as any).stock > 0) {
        (update as any).status = 'in_stock';
      }
    }
    this.setUpdate(update);
  }

  next();
});

export default mongoose.model<IBook>('Book', BookSchema);
