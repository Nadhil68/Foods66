import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import './services/queueService'; // BullMQ Worker
import { initFirebase, getFirestore } from './config/firebase';
import { ObjectIdMock } from './models/firestoreModel';
import { env } from './config/envConfig';
import { logger } from './utils/logger';

import usersRouter from './routes/users';
import foodsRouter from './routes/foods';
import ordersRouter from './routes/orders';
import aiRouter from './routes/ai';
import searchRouter from './routes/search';
import restaurantsRouter from './routes/restaurants';
import couponsRouter from './routes/coupons';
import deliveriesRouter from './routes/deliveries';
import analyticsRouter from './routes/analytics';
import paymentsRouter from './routes/payments';
import webhooksRouter from './routes/webhooks';
import uploadRouter from './routes/upload';
import feedbackRouter from './routes/feedback';
import favoritesRouter from './routes/favorites';

import path from 'path';
import { fileURLToPath } from 'url';
import { setupSecurityMiddlewares } from './middlewares/security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;

// Security Middleware
setupSecurityMiddlewares(app);

// Allowed origins
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:5000',    // Android emulator
  'http://10.0.2.2:3000',    // Android emulator (frontend)
].filter(Boolean);

// Dynamic origin validator supporting Vercel previews and deployments
const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // Mobile apps, curl, server-to-server
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (process.env.VERCEL_URL && origin.includes(process.env.VERCEL_URL)) return true;
  return false;
};

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'stripe-signature'],
}));

// Webhooks must be parsed as raw bytes before express.json() intercepts
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), webhooksRouter);

// JSON body parser with safe request limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to Live Firebase Firestore
initFirebase();

// API Routes
app.use('/api/users', usersRouter);

app.use('/api/foods', foodsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/search', searchRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/admin/coupons', couponsRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/favorites', favoritesRouter);

// Serve static uploads (from project root /uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Root route
app.get('/', (_req, res) => {
  res.send('Foods66 Enterprise API is running! Please access the frontend web application on port 3000.');
});

// Health check
app.get('/api/health', async (_req, res) => {
  let firestoreStatus = 'disconnected';
  let firestoreStats: any = null;
  try {
    const db = getFirestore();
    const fCountSnap = await db.collection('foods').count().get();
    const uCountSnap = await db.collection('users').count().get();
    const oCountSnap = await db.collection('orders').count().get();
    firestoreStatus = 'connected';
    firestoreStats = {
      foods: fCountSnap.data().count,
      users: uCountSnap.data().count,
      orders: oCountSnap.data().count,
    };
  } catch (err: any) {
    firestoreStatus = 'error: ' + (err.message || 'unknown');
  }

  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Foods66 Backend is running with Live Firebase Firestore',
    databases: {
      firebaseFirestore: firestoreStatus,
      firestoreStats,
    },
    projectId: 'foods66-3e9a5',
    timestamp: new Date()
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error('UNHANDLED_EXCEPTION', err.message || 'Unhandled Application Error', {
    error: err,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  const status = err.status || err.statusCode || 500;
  const isProd = env.isProduction;
  const message = isProd && status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error');
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(status).json({
    success: false,
    message,
    code,
  });
});

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (socket as any).userId = decoded.id;
    } catch (err) {
      // Invalid token, continue as unauthenticated guest (e.g. for guest tracking)
      (socket as any).userId = null;
    }
  }
  next();
});

io.on('connection', (socket) => {
  const authUserId = (socket as any).userId;

  // Join user-specific notification room (strictly verify identity if authenticated)
  socket.on('join', (userId: string) => {
    if (userId) {
      if (authUserId && authUserId !== userId) {
        logger.security('SOCKET_UNAUTHORIZED_ROOM_JOIN', 'User tried to join unauthorized room', {
          authUserId,
          targetUserId: userId,
        });
        return;
      }
      socket.join(userId);
      console.log(`🔌 User ${userId} connected to notification channel`);
    }
  });

  // Join order tracking room with authorization check
  socket.on('join_tracking', async (orderId: string) => {
    if (orderId) {
      try {
        if (authUserId) {
          const { Order } = await import('./models/Order');
          const { User } = await import('./models/User');
          let order = null;
          if (ObjectIdMock.isValid(orderId)) {
            order = await Order.findById(orderId);
          } else if (orderId.startsWith('cs_') || orderId.startsWith('mock_sess_')) {
            order = await Order.findOne({ sessionId: orderId });
          }

          if (order) {
            const user = await User.findById(authUserId);
            const isOwner = order.userId === authUserId;
            const isDriver = user?.role === 'driver' && (!order.deliveryPartnerId || order.deliveryPartnerId === authUserId);
            const isAdmin = user?.role === 'admin' || user?.role === 'restaurant';

            if (!isOwner && !isDriver && !isAdmin) {
              logger.security('SOCKET_UNAUTHORIZED_TRACKING_JOIN', 'User tried to join unauthorized order tracking room', {
                authUserId,
                orderId,
                orderOwner: order.userId
              });
              return;
            }
          }
        }
        socket.join(`tracking_${orderId}`);
        console.log(`📍 Socket joined live tracking room: tracking_${orderId}`);
      } catch (err) {
        socket.join(`tracking_${orderId}`);
      }
    }
  });

  // Leave order tracking room
  socket.on('leave_tracking', (orderId: string) => {
    if (orderId) {
      socket.leave(`tracking_${orderId}`);
      console.log(`📍 Socket left live tracking room: tracking_${orderId}`);
    }
  });

  // Handle real-time driver location updates
  socket.on('driver:location:update', async (data: { orderId: string, latitude: number, longitude: number, accuracy?: number, heading?: number, speed?: number, timestamp?: number }) => {
    if (!authUserId || !data.orderId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
    
    // Validate coordinates
    if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) return;

    try {
      const { Delivery } = await import('./models/Delivery');
      const { User } = await import('./models/User');

      // Verify user is a driver
      const user = await User.findById(authUserId);
      if (user?.role !== 'driver') return;

      // Verify driver is assigned to this delivery
      const delivery = await Delivery.findOne({ orderId: data.orderId, deliveryPartnerId: authUserId });
      if (!delivery || delivery.status !== 'OUT_FOR_DELIVERY') return;

      // Update location
      const coordinates: [number, number] = [data.longitude, data.latitude]; // [lng, lat] for GeoJSON
      delivery.currentLocation = {
        type: 'Point',
        coordinates
      };
      await delivery.save();

      // Optionally update driver's active location
      await User.findByIdAndUpdate(authUserId, { currentLocation: delivery.currentLocation });

      // Broadcast to tracking room
      io.to(`tracking_${data.orderId}`).emit('delivery:location', {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: data.timestamp || Date.now()
      });
    } catch (error) {
      logger.error('SOCKET_LOCATION_UPDATE_ERROR', 'Error updating driver location', { error, orderId: data.orderId });
    }
  });

  socket.on('disconnect', () => {
    // Client disconnected cleanly
  });
});

if (env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Foods66 Server running on port ${PORT}`);
  });
}

export { app, httpServer };
export default app;
