import { createFirestoreModel } from './firestoreModel';

export interface IRestaurant {
  _id?: string;
  id?: string;
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
  updatedAt?: Date;
  save?: () => Promise<any>;
}

export const Restaurant = createFirestoreModel<IRestaurant>('restaurants');
export default Restaurant;
