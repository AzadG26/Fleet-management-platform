import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ success: false, message: 'Invalid token' });
  // attach user
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) return res.status(403).json({ success: false, message: 'User not found' });
  req.user = user;
  next();
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  const decoded = verifyToken(token);
  if (decoded) req.user = decoded;
  next();
};