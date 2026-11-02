import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  rewardPoints: number;
  vehicle?: 'Bike' | 'Scooter' | 'Electric Bike' | 'Car';
  availability?: boolean;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  activeOrders?: number;
  rating?: number;
  isSuspended?: boolean;
  deliveryArea?: string;
  healthProfile?: {
    hasIssues: boolean;
    age?: number;
    diseaseName?: string;
    condition?: string;
    stage?: string;
    severity?: string;
    medicines?: string;
    medications?: string;
    diagnosedBy?: string;
    symptoms?: string;
    dietaryMemo?: string;
    validatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'driver', 'admin'],
    default: 'customer',
    index: true
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  rewardPoints: { type: Number, default: 0 },
  // Driver / Delivery Partner fields
  vehicle: {
    type: String,
    enum: ['Bike', 'Scooter', 'Electric Bike', 'Car'],
    default: 'Bike'
  },
  availability: { type: Boolean, default: true },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [80.2707, 13.0827] }
  },
  activeOrders: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  isSuspended: { type: Boolean, default: false },
  deliveryArea: { type: String, default: 'Chennai Central' },
  healthProfile: {
    hasIssues: { type: Boolean, default: false },
    age: Number,
    diseaseName: String,
    condition: String,
    stage: String,
    severity: String,
    medicines: String,
    medications: String,
    diagnosedBy: String,
    symptoms: String,
    dietaryMemo: String,
    validatedAt: Date,
  }
}, {
  timestamps: true
});

UserSchema.index({ role: 1, availability: 1, activeOrders: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
