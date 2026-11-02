import mongoose from 'mongoose';

export interface IRestaurant {
  _id?: string;
  userId: string; // The owner of the restaurant
  name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  liveStatus: 'open' | 'closed';
  earnings: number;
  reviews?: { text: string; sentimentScore: number; date: Date }[];
  createdAt?: Date;
}

const RestaurantSchema = new mongoose.Schema<IRestaurant>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  rating: { type: Number, default: 0 },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending' 
  },
  liveStatus: { 
    type: String, 
    enum: ['open', 'closed'],
    default: 'closed' 
  },
  earnings: { type: Number, default: 0 },
  reviews: [{
    text: String,
    sentimentScore: Number,
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

RestaurantSchema.index({ name: 'text', description: 'text' });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
