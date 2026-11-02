import { createFirestoreModel } from './firestoreModel';

export interface IFeedback {
  _id?: string;
  id?: string;
  orderId: string;
  userId: string;
  rating: number; // 1-5 stars
  deliveryRating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  save?: () => Promise<any>;
}

export const Feedback = createFirestoreModel<IFeedback>('feedback');
export default Feedback;
