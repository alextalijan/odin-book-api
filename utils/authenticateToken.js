const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) {
    return res
      .sendStatus(401)
      .json({ success: false, message: 'No token provided.' }); // No token provided
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .sendStatus(403)
        .json({ success: false, message: 'Invalid or expired token.' }); // Invalid or expired token
    }
    req.user = decoded.sub; // Attach decoded payload to request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
