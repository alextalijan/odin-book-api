const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  getPost: async (req, res) => {
    // Fetch the post and check if it exists
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
      select: {
        id: true,
        text: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: {
          select: {
            text: true,
            author: {
              select: {
                username: true,
              },
            },
            commentedAt: true,
          },
          orderBy: {
            commentedAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        postedAt: true,
      },
    });
    if (!post) {
      return res.json({ success: false, message: 'Post not found.' });
    }

    // Check if the user follows the author of this post
    const followings = await prisma.following.findMany({
      where: {
        followerId: req.user.id,
        followedId: post.author.id,
      },
    });
    if (followings.length === 0) {
      return res.json({
        success: false,
        message: 'You do not follow this person.',
      });
    }

    // Return the post details
    res.json({ success: true, post });
  },
  likePost: async (req, res) => {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
    });
    if (!post) {
      return res.json({ success: false, message: 'Post does not exist.' });
    }

    // Check if the user has already liked the post
    const like = await prisma.like.findFirst({
      where: {
        userId: req.user.id,
        postId: req.params.postId,
      },
    });
    if (like) {
      return res.json({ success: false, message: 'Already liked.' });
    }

    // Send a like
    await prisma.like.create({
      data: {
        userId: req.user.id,
        postId: req.params.postId,
      },
    });

    res.json({ success: true, message: 'Liked post.' });
  },
  unlikePost: async (req, res) => {
    // Check if the like exists
    const like = await prisma.like.findFirst({
      where: {
        userId: req.user.id,
        postId: req.params.postId,
      },
    });
    if (!like) {
      return res.json({
        success: false,
        message: 'Cannot unlike a not liked post.',
      });
    }

    // Remove the like
    try {
      await prisma.like.deleteMany({
        where: {
          userId: req.user.id,
          postId: req.params.postId,
        },
      });

      res.json({ success: true, message: 'Post unliked.' });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }
  },
};
