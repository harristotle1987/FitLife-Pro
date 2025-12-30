
module.exports = (req, res, next) => {
  // Rely on the 'auth' middleware having already run and set req.user
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Identity verification required.' 
    });
  }

  const authorizedRoles = ['admin', 'super_admin', 'nutritionist'];
  
  if (!authorizedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: Insufficient clearance level for this operation.' 
    });
  }

  next();
};
