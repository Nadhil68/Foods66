import mongoose, { Document, Schema } from 'mongoose';

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

export interface IDelivery extends Document {
  _id: mongoose.Types.ObjectId;
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
}

const DeliverySchema = new Schema<IDelivery>({
  orderId: { type: String, required: true, unique: true, index: true },
  deliveryPartnerId: { type: String, index: true },
  deliveryPartnerName: { type: String },
  deliveryPartnerPhone: { type: String },
  status: {
    type: String,
    enum: [
      'AVAILABLE',
      'ASSIGNED',
      'ACCEPTED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'REJECTED',
      'CANCELLED'
    ],
    default: 'ASSIGNED',
    index: true
  },
  pickupLocation: {
    name: { type: String, default: 'Foods66 Kitchen' },
    address: { type: String, default: 'Anna Nagar, Chennai' },
    coordinates: { type: [Number], default: [80.21, 13.08] }
  },
  dropLocation: {
    name: { type: String },
    address: { type: String },
    coordinates: { type: [Number] }
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  rejectedBy: [{ type: String }],
  eta: { type: Date },
  distance: { type: String },
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, {
  timestamps: true
});

// Enable geospatial indexing
DeliverySchema.index({ currentLocation: '2dsphere' });
DeliverySchema.index({ deliveryPartnerId: 1, status: 1 });
DeliverySchema.index({ status: 1, createdAt: -1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
