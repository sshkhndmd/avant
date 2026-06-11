import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Нет токена" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.role = decoded.role;

    next();
  } catch {
    return res.status(401).json({ error: "Неверный токен" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: "Нет роли пользователя" });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    next();
  };
}