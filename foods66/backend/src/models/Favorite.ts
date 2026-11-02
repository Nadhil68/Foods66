import { createFirestoreModel } from './firestoreModel';

export interface IFavorite {
  _id: string;
  id?: string;
  userId: string;
  foodId: string;
  createdAt: Date;
  updatedAt?: Date;
  save?: () => Promise<any>;
}

export const Favorite = createFirestoreModel<IFavorite>('favorites');
export default Favorite;
