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

    // Add isLiked by user field
    const postInfo = {
      ...post,
      isLiked: post.likes.length > 0 ? true : false,
    };

    // Return the post details
    res.json({ success: true, post: postInfo });
  },
  getComments: async (req, res) => {
    // Fetch the post to see if it exists
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
      select: {
        authorId: true,
      },
    });
    if (!post) {
      return res.json({ success: true, message: 'Post does not exist.' });
    }

    // Check if the user follows the author of this post
    const followings = await prisma.following.findMany({
      where: {
        followerId: req.user.id,
        followedId: post.authorId,
      },
    });
    if (followings.length === 0) {
      return res.json({
        success: false,
        message: 'You do not follow this person.',
      });
    }

    // Fetch the comments of the post
    const comments = await prisma.comment.findMany({
      where: {
        postId: req.params.postId,
      },
      select: {
        id: true,
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
      take: parseInt(req.query.pageNum) * 10,
    });

    return res.json({ success: true, comments });
  },
  sendComment: async (req, res) => {
    // Check if the comment is empty
    if (req.body.comment === '') {
      return res.json({
        success: false,
        message: 'Cannot send empty comment.',
      });
    }

    // Check if the user follows the person who posted
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    const following = await prisma.following.findMany({
      where: {
        followedId: post.authorId,
        followerId: req.user.id,
      },
    });
    if (following.length === 0) {
      return res.json({
        success: false,
        message: 'You are not following this person.',
      });
    }

    // Send the comment
    await prisma.comment.create({
      data: {
        text: req.body.comment,
        authorId: req.user.id,
        postId: req.params.postId,
      },
    });

    res.json({ success: true, message: 'Comment sent.' });
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
