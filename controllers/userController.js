const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  register: async (req, res) => {
    // Check if username is empty
    if (req.body.username === '') {
      return res.json({ success: false, message: 'Username cannot be empty.' });
    }

    // Check if username already exists
    const user = await prisma.user.findUnique({
      where: {
        username: req.body.username.trim().toLowerCase(),
      },
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
    const token = jwt.sign(
      { sub: { ...registeredUser } },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    // Set the token inside a cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.DEVELOPMENT === 'true' ? false : true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user: registeredUser });
  },
  findUser: async (req, res) => {
    // Find the 10 users containing the search query
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id,
        },
        username: {
          contains: req.query.username.trim().toLowerCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        followers: {
          select: {
            followerId: true,
          },
        },
      },
      take: 10,
    });

    // Get the list of follow requests of this user
    const requests = await prisma.followRequest.findMany({
      where: {
        senderId: req.user.id,
        status: 'pending',
      },
      select: {
        receiverId: true,
      },
    });

    // Check for every single user if the requester follows them
    for (const user of users) {
      // Check if the user sent the request to this one
      for (const request of requests) {
        if (request.receiverId === user.id) {
          user.requestSent = true;
          break;
        }
      }

      for (const following of user.followers) {
        if (following.followerId === req.user.id) {
          user.isFollowed = true;
          break;
        }
      }
    }

    res.json({ success: true, users });
  },
  returnUser: async (req, res) => {
    res.json({ success: true, user: req.user });
  },
  getFeed: async (req, res) => {
    // Check if the user has access to these followings
    if (req.user.id !== req.params.userId) {
      return res.json({
        success: false,
        message: 'Not authorized to see these posts.',
      });
    }

    // Get the list of all followings
    const followings = await prisma.following.findMany({
      where: {
        followerId: req.params.userId,
      },
      select: {
        followedId: true,
      },
    });

    // Filter their ids and add the user himself
    const followedIds = [
      ...followings.map((following) => following.followedId),
      req.params.userId,
    ];

    // Fetch posts and relevant information
    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: followedIds,
        },
      },
      select: {
        id: true,
        text: true,
        author: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: {
            userId: req.user.id,
          },
          select: { id: true },
        },
        postedAt: true,
        comments: {
          select: {
            id: true,
            text: true,
            author: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            commentedAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: 20 * parseInt(req.query.page),
    });

    // Add info on if the user has liked
    const resultPosts = posts.map((post) => {
      return {
        ...post,
        isLiked: post.likes.length > 0 ? true : false,
      };
    });

    res.json({ success: true, posts: resultPosts });
  },
  unfollowUser: async (req, res) => {
    // Check if the user is even following the account
    const following = await prisma.following.findMany({
      where: {
        followedId: req.params.userId,
        followerId: req.user.id,
      },
    });
    if (!following) {
      return res.json({
        success: false,
        message: 'You are not following this person.',
      });
    }

    // Remove the following
    try {
      await prisma.following.deleteMany({
        where: {
          followedId: req.params.userId,
          followerId: req.user.id,
        },
      });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    res.json({ success: true, message: 'Unfollowed.' });
  },
  sendFollowRequest: async (req, res) => {
    // Check if the user is already following
    const followings = await prisma.following.findMany({
      where: {
        followedId: req.params.userId,
        followerId: req.user.id,
      },
    });
    if (followings.length > 0) {
      return res.json({
        success: false,
        message: 'You are already following this person.',
      });
    }

    // Send the follow request
    try {
      await prisma.followRequest.create({
        data: {
          senderId: req.user.id,
          receiverId: req.params.userId,
        },
      });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    res.json({ success: true, message: 'Follow request sent.' });
  },
  cancelRequest: async (req, res) => {
    // Check if the request exists
    const [request] = await prisma.followRequest.findMany({
      where: {
        senderId: req.user.id,
        receiverId: req.params.userID,
        status: 'pending',
      },
      select: {
        id: true,
      },
    });
    if (!request) {
      return res.json({
        success: false,
        message: 'You have not sent a request.',
      });
    }

    // Change the request status to cancelled
    try {
      await prisma.followRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: 'canceled',
        },
      });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    res.json({ success: true, message: 'Request cancelled.' });
  },
};
