const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  register: async (req, res) => {
    // Check if username already exists
    const user = await prisma.user.findUnique({
      username: req.body.username.trim().toLowerCase(),
    });
    if (user) {
      return res.json({ success: false, message: 'Username already in use.' });
    }

    // Check if password is empty
    if (req.body.password === '') {
      return res.json({
        success: false,
        message: 'You must provide a valid password.',
      });
    }

    // Check if password and confirmation match
    if (req.body.password !== req.body.passwordConfirmation) {
      return res.json({
        success: false,
        message: 'Password and confirmation do not match.',
      });
    }

    // Generate a password hash
    const hash = await bcrypt.hash(req.body.password, 10);

    // Add the new user to the database
    const registeredUser = await prisma.user.create({
      data: {
        username: req.body.username.trim().toLowerCase(),
        hash,
      },
      select: {
        id: true,
        username: true,
      },
    });

    // Create json web token
    const token = jwt.sign({ ...registeredUser }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Set the token inside a cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.DEVELOPMENT === 'true' ? false : true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: 'Registered successfully.' });
  },
};
