// server/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kyodo-food-secret-key-trung-nu-vuong-da-nang-2026';
const TOKEN_EXPIRY = '30d'; // 30 ngày để nhân viên trên điện thoại không bị đăng xuất liên tục

function generateToken(user, role) {
  const payload = {
    id: user.id || user.username,
    username: user.username,
    role: role || 'employee',
    name: user.name || user.fullName || user.shortName || user.username
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware giải mã token (nếu có)
function extractUserMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.cookies && req.cookies.kyodo_token) {
    token = req.cookies.kyodo_token;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

// Middleware bắt buộc phải đăng nhập
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại!'
    });
  }
  next();
}

// Middleware bắt buộc phải là Quản Trị Viên (Admin)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác Quản trị viên này!'
    });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  extractUserMiddleware,
  requireAuth,
  requireAdmin
};
