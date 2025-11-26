const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');
const { sign } = require('../utils/jwt');
const router = express.Router();

// signup (admin only in production; for demo open)
router.post('/signup', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).send('email+password required');
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name, role }});
  const token = sign(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role }});
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(401).send('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send('Invalid credentials');
  const token = sign(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role }});
});

module.exports = router;
