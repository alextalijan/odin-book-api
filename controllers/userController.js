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
        hasAvatar: true,
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
  getAccount: async (req, res) => {
    let account;

    // If the user requesting the account is the owner
    if (req.params.username === req.user.username) {
      // Return all sensitive info about the account
      account = await prisma.user.findUnique({
        where: {
          username: req.params.username,
        },
        select: {
          id: true,
          username: true,
          hasAvatar: true,
          _count: {
            select: {
              following: true,
              followers: true,
              incomingRequests: true,
              posts: true,
            },
          },
        },
      });
    }
    // Else less user info
    else {
      account = await prisma.user.findFirst({
        where: {
          username: {
            equals: req.params.username,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          username: true,
          hasAvatar: true,
          _count: {
            select: {
              following: true,
              followers: true,
              posts: true,
            },
          },
          followers: {
            select: {
              followerId: true,
            },
          },
        },
      });

      // Check if the account exists
      if (!account) {
        return res.json({ success: false, message: 'Account does not exist.' });
      }

      // Check if the user follows this account
      for (const following of account.followers) {
        if (following.followerId === req.user.id) {
          account.isFollowed = true;
          break;
        }
      }

      // If the account isn't followed check if there's a pending request
      if (!account.isFollowed) {
        const [request] = await prisma.followRequest.findMany({
          where: {
            senderId: req.user.id,
            receiverId: account.id,
            status: 'pending',
          },
        });

        // If the request exists, send
        if (request) {
          account.requestSent = true;
        }
      }
    }

    res.json({ success: true, account });
  },
  getAccountPosts: async (req, res) => {
    // Check if the user has access to these posts
    const [following] = await prisma.following.findMany({
      where: {
        followedId: req.params.userId,
        followerId: req.user.id,
      },
    });

    // User either follows or is the owner of the account
    if (!following && req.params.userId !== req.user.id) {
      return res.json({
        success: false,
        message: 'You do not have access to these posts.',
      });
    }

    // Get posts
    const posts = await prisma.post.findMany({
      where: {
        authorId: req.params.userId,
      },
      select: {
        id: true,
        text: true,
        author: {
          select: {
            id: true,
            username: true,
            hasAvatar: true,
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
      take: 10 * parseInt(req.query.page),
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
            id: true,
            username: true,
            hasAvatar: true,
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
  getFollowers: async (req, res) => {
    // Fetch the followers of this account
    const followings = await prisma.following.findMany({
      where: {
        followedId: req.params.userId,
      },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            hasAvatar: true,
            followers: {
              select: {
                followerId: true,
              },
            },
          },
        },
      },
    });

    // Filter out followers information
    const followers = followings.map((following) => following.follower);

    // Check for each user if request from the requesting user exists
    for (const follower of followers) {
      const request = await prisma.followRequest.findFirst({
        where: {
          status: 'pending',
          receiverId: follower.id,
          senderId: req.user.id,
        },
      });

      if (request) {
        follower.requestSent = true;
      } else {
        // Else check if the user is following this account
        for (const f of follower.followers) {
          if (f.followerId === req.user.id) {
            follower.isFollowed = true;
            break;
          }
        }
      }
    }

    // Check if the user is the owner of account
    if (req.user.id === req.params.userId) {
      return res.json({ success: true, followers });
    }

    // Check if the user is in the followers
    for (const following of followings) {
      if (following.follower.id === req.user.id) {
        return res.json({ success: true, followers });
      }
    }

    // The user isn't a follower
    res.json({
      success: false,
      message: 'Not authorized to see followers of this account.',
    });
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
  getFollowings: async (req, res) => {
    // Fetch the followings
    const followings = await prisma.following.findMany({
      where: {
        followerId: req.params.userId,
      },
      select: {
        followed: {
          select: {
            id: true,
            username: true,
            hasAvatar: true,
          },
        },
        follower: {
          select: {
            id: true,
          },
        },
      },
    });

    // Filter out following information
    const followerIds = followings.map((following) => following.follower.id);
    const followingsList = followings.map((following) => {
      return { ...following.followed, isFollowed: true };
    });

    // Check if the user is the owner of account
    if (req.user.id === req.params.userId) {
      return res.json({ success: true, followings: followingsList });
    }

    // Check if the user is in the followers
    for (const id of followerIds) {
      if (id === req.user.id) {
        return res.json({ success: true, followings: followingsList });
      }
    }

    // The user isn't a follower
    res.json({
      success: false,
      message: 'Not authorized to see followings of this account.',
    });
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
        receiverId: req.params.userId,
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
