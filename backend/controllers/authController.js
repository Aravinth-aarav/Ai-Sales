import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refreshsecret123', {
    expiresIn: '7d',
  });
};

const setRefreshTokenCookie = (res, id) => {
  const refreshToken = generateRefreshToken(id);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    setRefreshTokenCookie(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      role: user.role,
      token: generateAccessToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, shopName } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    shopName,
  });

  if (user) {
    setRefreshTokenCookie(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      role: user.role,
      token: generateAccessToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Parse cookies manually from headers to avoid extra middleware requirements
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts[0]) {
      cookies[parts[0].trim()] = parts[1] ? decodeURIComponent(parts[1].trim()) : '';
    }
  });

  const refreshToken = cookies['refreshToken'];

  if (!refreshToken) {
    res.status(401);
    throw new Error('Refresh token not found');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecret123');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Set a new refresh token to slide the session window, then send the new access token
    setRefreshTokenCookie(res, user._id);
    res.json({
      token: generateAccessToken(user._id)
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Get all users (for management dashboard)
// @route   GET /api/auth/users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }
  // Prevent deleting oneself if logged in
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own active administrator account.');
  }
  await User.deleteOne({ _id: req.params.id });
  res.json({ message: 'User deleted successfully.' });
});
