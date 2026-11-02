import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  foodId: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true, index: true },
  foodId: { type: String, required: true },
}, {
  timestamps: true
});

// Compound unique index: one user can favorite a food only once
FavoriteSchema.index({ userId: 1, foodId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
