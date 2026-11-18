const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token ausente ou inválido', error: 'Token ausente ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: payload.id,
      name: payload.name
    };
    return next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado', error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;