const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

module.exports = {
  login: async (req, res) => {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        username: req.body.username,
      },
      select: {
        id: true,
        username: true,
        hash: true,
      },
    });

    if (!user) {
      return res.json({ success: false, message: 'User does not exist.' });
    }

    // Check if the password is correct
    const passwordMatches = await bcrypt.compare(req.body.password, user.hash);
    if (!passwordMatches) {
      return res.json({ success: false, message: 'Incorrect password.' });
    }

    // Generate a token
    const token = jwt.sign(
      { sub: { id: user.id, username: user.username } },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    // Set the token inside a cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none',
    });

    res.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  },
  logout: (req, res) => {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.DEVELOPMENT === 'true' ? false : true,
    });
    res.json({ success: true, message: 'Logged out.' });
  },
};
