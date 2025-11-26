const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'change-this-secret';
function sign(user) { return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' }); }
function verify(token) { return jwt.verify(token, SECRET); }
module.exports = { sign, verify };
