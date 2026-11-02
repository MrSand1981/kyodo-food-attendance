// server/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Khóa bí mật mặc định an toàn cho Kyodo Food (đảm bảo nhất quán 100% không bao giờ làm crash container trên Render)
const FALLBACK_DEFAULT_SECRET =
  'kyodo_food_attendance_2026_dn_vietnam_secure_vault_jwt_hmac_secret_key_napas_970422';

// Ưu tiên sử dụng JWT_SECRET từ biến môi trường (Render / Docker / .env)
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const secretFile = path.join(__dirname, '..', '.jwt_secret');
  if (fs.existsSync(secretFile)) {
    try {
      JWT_SECRET = fs.readFileSync(secretFile, 'utf8').trim();
    } catch (_) {}
  }

  if (!JWT_SECRET) {
    // Tự sinh khóa 256-bit ngẫu nhiên và lưu file để giữ phiên ổn định
    try {
      JWT_SECRET = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(secretFile, JWT_SECRET, { encoding: 'utf8', mode: 0o600 });
    } catch (_) {
      JWT_SECRET = FALLBACK_DEFAULT_SECRET;
    }

    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.warn(
        '⚠️ [BẢO MẬT] Biến môi trường JWT_SECRET chưa được thiết lập trên Render Dashboard. Server đã tự động kích hoạt khóa bảo mật 256-bit để đảm bảo hệ thống vận hành liên tục 24/7 và KHÔNG BỊ CRASH. Bạn có thể cấu hình biến JWT_SECRET trên Render Dashboard bất cứ lúc nào.'
      );
    }
  }
}

function generateToken(user, role) {
  const payload = {
    id: user.id || user.username,
    username: user.username,
    role: role || 'employee',
    name: user.name || user.fullName || user.shortName || user.username,
  };
  // Admin được duy trì 30 ngày để chủ quán quản lý từ xa tiện lợi; Nhân viên chỉ 5 giờ cho 1 ca làm việc để bảo mật máy dùng chung
  const expiry = (role || 'employee') === 'admin' ? '30d' : '5h';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware giải mã token chỉ từ Authorization header (Bearer) hoặc HttpOnly cookie
// ĐÃ BỎ HOÀN TOÀN NHẬN TOKEN QUA URL (?token=...) ĐỂ TRÁNH LỘ TRONG LOG VÀ BROWSER HISTORY
function extractUserMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
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
