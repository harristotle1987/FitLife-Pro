
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication protocol required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id and role
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
};
