import { Schema, model, Document } from 'mongoose';

interface INotification extends Document {
  userId: string;
  type: string;
  message: string;
  relatedId: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const NotificationModel = model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
