import User from '../models/User.js';
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
} from '../services/auth.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',

  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',

  path: '/',
};

export const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token không được tìm thấy',
      });
    }

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        req.user = decoded;
        return next();
      } catch (error) {
        if (error.name !== 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ',
            error: error.message,
          });
        }
      }
    }

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token hết hạn và không có refresh token',
      });
    }

    const decodedRefresh = verifyRefreshToken(refreshToken);
    const user = await User.findById(decodedRefresh.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const tokenRecord = user.refreshTokens.find(
      (rt) => rt.token === refreshToken && new Date(rt.expiresAt) > new Date(),
    );

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    const newAccessToken = generateAccessToken(user._id, user.email, user.role);
    res.cookie('accessToken', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    req.user = verifyAccessToken(newAccessToken);
    return next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      error: error.message,
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin có thể truy cập',
    });
  }
  next();
};
