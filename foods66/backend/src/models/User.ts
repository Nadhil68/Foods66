import { createFirestoreModel, ObjectIdMock } from './firestoreModel';

export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

export interface IUser {
  _id: string;
  id?: string;
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
  save?: () => Promise<any>;
}

export const User = createFirestoreModel<IUser>('users');
export default User;
