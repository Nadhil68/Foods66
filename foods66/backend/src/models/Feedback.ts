import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  orderId: string;
  userId: string;
  rating: number; // 1-5 stars
  deliveryRating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  deliveryRating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
