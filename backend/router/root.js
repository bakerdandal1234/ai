const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/Schema');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/emailConfig');
const { sendResetPasswordEmail } = require('../utils/emailConfig');
const { verifyToken } = require('../middleware')
const { authenticateUser } = require('../middleware')

// Middleware for parsing JSON bodies
router.use(express.json());

// Validation middleware
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Signup route
router.post('/signup', signupValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 24 hours

    // Create new user with all required fields
    const user = await User.create({
      ...req.body,
      verificationToken,
      verificationTokenExpiry
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token to user (will be automatically hashed)
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Send response
    res.status(201).json({
      message: 'User created successfully. Please check your email for verification.',
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Email verification route

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        errorEmail: 'Email not found. Please check your email and try again.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        success: false,
        errorPassword: 'Password is incorrect. Please try again.'
      });
    }

   // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true 
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token hash in database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    // Set refresh token in http-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send response
    res.json({
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log('Refresh token received:', !!refreshToken); // Debug log
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log('Token decoded:', decoded); // Debug log

    // Find user and include refreshToken field
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user) {
      console.log('User not found for token:', decoded.userId); // Debug log
      return res.status(401).json({ message: 'User not found' });
    }

    // Verify stored refresh token
    if (!user.refreshToken) {
      console.log('No stored refresh token for user:', user._id); // Debug log
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Send response with new tokens
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
});

// Logout route
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // حذف refreshToken من قاعدة البيانات
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    // حذف الكوكيز
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax',
      path: '/'
    });

    // إرسال استجابة
    res.status(200).json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الخروج' });
  }
});

router.get('/', (req, res) => {
  res.send('Hello World!')
});

router.use('/protected-route', verifyToken, (req, res) => {
  res.json({ message: 'تم الوصول إلى المسار المحمي' });
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      $or: [
        { verificationToken: token },
        { email: token }  // يمكننا البحث عن المستخدم باستخدام البريد الإلكتروني أيضاً
      ]
    });

    if (!user) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    // إذا كان المستخدم مؤكداً بالفعل
    if (user.isVerified) {
      return res.json({
        isVerified: true,
        alreadyVerified: true,
        message: 'Email is already verified'
      });
    }

    // التحقق من صلاحية الرمز
    if (!user.verificationToken || user.verificationToken !== token || 
        !user.verificationTokenExpiry || user.verificationTokenExpiry < Date.now()) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
        isVerified: user.isVerified
      });
    }

    // تحديث حالة التحقق
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ 
      isVerified: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password request route
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    // التحقق من وجود البريد الإلكتروني
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعة

    // تحديث المستخدم برمز إعادة التعيين
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
    await sendResetPasswordEmail(email, resetToken);

    res.json({
      message: 'Password reset instructions have been sent to your email'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Failed to process reset password request'
    });
  }
});

// Reset password verification route
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      message: 'Valid reset token',
      email: user.email
    });
  } catch (error) {
    console.error('Reset token verification error:', error);
    res.status(500).json({
      message: 'Failed to verify reset token'
    });
  }
});

// Update password route
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    // تحديث كلمة المرور
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // مسح رموز إعادة التعيين
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    
    await user.save();

    res.json({
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Failed to reset password'
    });
  }
});

module.exports = router;