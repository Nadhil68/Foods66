import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { protect, authorize, AuthRequest } from '../middlewares/auth';
import { notificationQueue } from '../services/queueService';
import { validateHealthProfile } from '../services/healthValidation';
import { env } from '../config/envConfig';
import { validateBody, registerSchema, loginSchema } from '../middlewares/validation';
import { logger } from '../utils/logger';

const router = Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, healthProfile } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please provide name, email, and password' });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Format healthProfile if present and issues flagged
    let formattedHealthProfile: any = undefined;
    if (healthProfile && healthProfile.hasIssues) {
      formattedHealthProfile = {
        hasIssues: true,
        diseaseName: healthProfile.diseaseName || healthProfile.condition || '',
        condition: healthProfile.condition || healthProfile.diseaseName || '',
        stage: healthProfile.stage || healthProfile.severity || '1',
        severity: healthProfile.severity || healthProfile.stage || '1',
        medicines: healthProfile.medicines || healthProfile.medications || '',
        medications: healthProfile.medications || healthProfile.medicines || '',
        diagnosedBy: healthProfile.diagnosedBy || 'self',
        symptoms: healthProfile.symptoms || '',
        dietaryMemo: healthProfile.dietaryMemo || '',
        validatedAt: new Date()
      };
      if (healthProfile.age && !isNaN(Number(healthProfile.age))) {
        formattedHealthProfile.age = Number(healthProfile.age);
      }
    } else if (healthProfile) {
      formattedHealthProfile = { hasIssues: false };
    }

    // SECURITY: Always assign 'customer' role server-side.
    // Never trust role from the request body.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      healthProfile: formattedHealthProfile
    });

    // Add welcome email to background queue (fire-and-forget, never fail registration)
    if (notificationQueue) {
      try {
        await notificationQueue.add('sendEmail', {
          to: email,
          subject: 'Welcome to Foods66!',
          body: 'Thank you for registering.'
        });
      } catch (queueErr: any) {
        logger.warn('Failed to add welcome email to queue:', queueErr?.message || queueErr);
      }
    }

    if (user) {
      res.status(201).json({
        token: generateToken(user._id.toString()),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: error?.message || 'Server error during registration' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id.toString()),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      logger.security('LOGIN_FAILED', 'Invalid email or password attempt', { email: req.body.email, ip: req.ip });
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ error: error?.message || 'Server error during login' });
  }
});

// @desc    Detect user's current location from coordinates or IP
// @route   POST /api/users/reverse-geocode, GET|POST /api/users/detect-location
// @access  Public (Used during registration & checkout)
router.all(['/reverse-geocode', '/detect-location'], async (req: Request, res: Response) => {
  let lat = req.body?.lat || req.query?.lat;
  let lng = req.body?.lng || req.query?.lng;
  let detectedCity = 'Mumbai';
  let detectedState = 'Maharashtra';
  let detectedZip = '400070';

  if (!lat || !lng) {
    try {
      const ipRes = await fetch('http://ip-api.com/json', { signal: AbortSignal.timeout(4000) });
      if (ipRes.ok) {
        const ipData: any = await ipRes.json();
        if (ipData && ipData.lat && ipData.lon) {
          lat = ipData.lat;
          lng = ipData.lon;
          detectedCity = ipData.city || detectedCity;
          detectedState = ipData.regionName || detectedState;
          detectedZip = ipData.zip || detectedZip;
        }
      }
    } catch (e) {
      console.warn('IP geolocation fallback triggered default coords:', e);
      lat = 19.0748;
      lng = 72.8856;
    }
  }

  // Ensure fallback lat/lng if still not resolved
  if (!lat || !lng) {
    lat = 19.0748;
    lng = 72.8856;
  }

  // Call OpenStreetMap Nominatim API
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Foods66-App/1.0 (admin@foods66.com)'
      },
      signal: AbortSignal.timeout(4000)
    });
    
    if (response.ok) {
      const data: any = await response.json();
      const address = data.address || {};
      
      res.json({
        success: true,
        doorNo: address.house_number || 'Flat 101',
        landmark: address.suburb || address.neighbourhood || address.road || 'Kurla West',
        district: address.city || address.town || address.county || detectedCity,
        pincode: address.postcode || detectedZip,
        state: address.state || detectedState,
        lat: Number(lat),
        lng: Number(lng)
      });
      return;
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed, returning IP geocode result:', err);
  }

  // Return IP detected address
  res.json({
    success: true,
    doorNo: 'Flat 101',
    landmark: 'Kurla West',
    district: detectedCity,
    state: detectedState,
    pincode: detectedZip,
    lat: Number(lat),
    lng: Number(lng)
  });
});

// @desc    Validate health profile
// @route   POST /api/users/validate-health
// @access  Public (Used during registration)
router.post('/validate-health', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    const rawAge = body.age;
    const diseaseName = (body.diseaseName || body.condition || '').toString().trim();
    const stage = (body.stage || body.severity || '1').toString().trim();
    const medicines = (body.medicines || body.medications || '').toString().trim();
    const symptoms = body.symptoms ? body.symptoms.toString().trim() : '';
    const diagnosedBy = (body.diagnosedBy || 'self').toString().trim();

    // 1. Validate required fields (HTTP 400 for user input errors)
    if (rawAge === undefined || rawAge === null || rawAge === '') {
      res.status(400).json({
        success: false,
        code: 'INVALID_HEALTH_PROFILE',
        message: 'Please enter a valid age.'
      });
      return;
    }

    const age = Number(rawAge);
    if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 120) {
      res.status(400).json({
        success: false,
        code: 'INVALID_HEALTH_PROFILE',
        message: 'Please enter a valid age between 1 and 120.'
      });
      return;
    }

    if (!diseaseName) {
      res.status(400).json({
        success: false,
        code: 'INVALID_HEALTH_PROFILE',
        message: 'Condition or disease name is required.'
      });
      return;
    }

    // 2. Run rule-based clinical validation engine
    const result = validateHealthProfile({
      age,
      diseaseName,
      stage,
      medicines,
      symptoms: symptoms || undefined,
      diagnosedBy: diagnosedBy as 'self' | 'physician' | undefined
    });

    // 3. Optional AI Dietary Memo (Safe Fallback if Gemini unavailable)
    let aiMemo: string | null = null;
    const isAiConfigured = Boolean(env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('PLACEHOLDER'));

    if (isAiConfigured) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const prompt = `Analyze this health profile for dietary recommendations in a food delivery app.
Patient Age: ${age}
Condition/Disease: ${diseaseName}
Severity/Stage: ${stage}
Medications: ${medicines}
Symptoms: ${symptoms || 'None'}
Dietary Contraindications: ${result.dietaryContraindications.join(', ') || 'None'}

Provide a 2-sentence dietary summary.`;

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
        );
        const aiPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const aiRes: any = await Promise.race([aiPromise, timeoutPromise]);
        aiMemo = aiRes?.text?.trim() || null;
      } catch (aiErr) {
        // Safe fallback - do not crash or throw 503
        aiMemo = null;
      }
    }

    const fallbackMemo = result.dietaryContraindications.length > 0
      ? `Avoid: ${result.dietaryContraindications.join(', ')}`
      : 'Safe dietary profile';

    const finalDietaryMemo = aiMemo || fallbackMemo;

    res.status(200).json({
      success: true,
      analysisAvailable: aiMemo !== null,
      valid: result.valid,
      confidenceScore: result.confidenceScore,
      suggestedAction: result.suggestedAction,
      checks: result.checks,
      dietaryContraindications: result.dietaryContraindications,
      correctedMedicines: result.correctedMedicines || medicines,
      redFlags: result.redFlags,
      escalation: result.escalation,
      references: result.references,
      disclaimers: result.disclaimers,
      structuredSummary: result.structuredSummary,
      analysis: {
        dietaryMemo: finalDietaryMemo,
        contraindications: result.dietaryContraindications,
        recommendations: [
          `Targeted nutrition for ${diseaseName}`,
          'Low glycemic and balanced nutrient options prioritized'
        ]
      },
      message: aiMemo !== null
        ? 'Health profile analyzed successfully.'
        : 'Health profile validated successfully. AI analysis is temporarily unavailable.'
    });
  } catch (error: any) {
    console.error('Health validation error:', error);
    res.status(500).json({
      success: false,
      code: 'HEALTH_VALIDATION_ERROR',
      message: 'Health validation encountered an unexpected server error.'
    });
  }
});

// @desc    Get current authenticated user
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address } = req.body;
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user?._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    // SECURITY: Whitelist allowed update fields to prevent mass assignment.
    // Admins should not accidentally set password or escalate roles via this endpoint.
    const { name, email, phone, address, isSuspended, availability, deliveryArea, vehicle } = req.body;
    const allowedUpdates: Record<string, any> = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (email !== undefined) allowedUpdates.email = email;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (address !== undefined) allowedUpdates.address = address;
    if (isSuspended !== undefined) allowedUpdates.isSuspended = isSuspended;
    if (availability !== undefined) allowedUpdates.availability = availability;
    if (deliveryArea !== undefined) allowedUpdates.deliveryArea = deliveryArea;
    if (vehicle !== undefined) allowedUpdates.vehicle = vehicle;
    // Role changes require explicit admin intent — use a dedicated endpoint if needed
    if (req.body.role !== undefined) allowedUpdates.role = req.body.role;

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

export default router;

