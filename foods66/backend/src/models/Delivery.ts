import { createFirestoreModel } from './firestoreModel';

export type DeliveryStatus = 
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface IDeliveryTimeline {
  status: DeliveryStatus;
  timestamp: Date;
  note?: string;
}

export interface IDelivery {
  _id: string;
  id?: string;
  orderId: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  status: DeliveryStatus;
  pickupLocation?: {
    name?: string;
    address?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  dropLocation?: {
    name?: string;
    address?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  assignedAt?: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  rejectedBy?: string[];
  eta?: Date;
  distance?: string;
  timeline: IDeliveryTimeline[];
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<any>;
}

export const Delivery = createFirestoreModel<IDelivery>('deliveries');
export default Delivery;
