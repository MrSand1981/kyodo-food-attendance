// server/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Bắt buộc sử dụng JWT_SECRET mạnh. Nếu môi trường chưa có, tự sinh chuỗi 256-bit ngẫu nhiên an toàn
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Sinh khóa ngẫu nhiên an toàn mật mã học
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ CẢNH BÁO BẢO MẬT: Chưa thiết lập biến môi trường JWT_SECRET trên Production!');
  }
}

const TOKEN_EXPIRY = '30d'; // 30 ngày để nhân viên trên điện thoại không bị đăng xuất liên tục

function generateToken(user, role) {
  const payload = {
    id: user.id || user.username,
    username: user.username,
    role: role || 'employee',
    name: user.name || user.fullName || user.shortName || user.username,
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

// Middleware giải mã token từ Authorization header, cookie hoặc query
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
      message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại!',
    });
  }
  next();
}

// Middleware bắt buộc phải là Quản Trị Viên (Admin) - ĐÃ BỎ BACKDOOR 20162020
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền thực hiện thao tác Quản trị viên này!',
  });
}

// Middleware kiểm tra quyền: Chỉ cho phép Admin HOẶC chính chủ tài khoản đó thao tác
function requireSelfOrAdmin(idKey = 'employeeId') {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại!',
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    const target = req.params[idKey] || req.body[idKey] || req.query[idKey];
    if (target && (req.user.id === target || req.user.username === target)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thao tác trên tài khoản của người khác!',
    });
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  extractUserMiddleware,
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin,
};
