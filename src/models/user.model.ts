import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  role: 'user' | 'admin' | 'deliver';
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  googleId: { type: String },
  role: { type: String, enum: ['user', 'admin', 'deliver'], default: 'user' },
});

export default mongoose.model<IUser>('User', UserSchema);
