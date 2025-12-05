const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
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
        userID: req.user.id,
        postId: req.params.postId,
      },
    });
    if (like) {
      return res.json({ success: false, message: 'Already liked.' });
    }

    // Send a like
    await prisma.like.create({
      data: {
        userID: req.user.id,
        postId: req.params.postId,
      },
    });

    res.json({ success: true, message: 'Liked post.' });
  },
  unlikePost: async (req, res) => {
    // Check if the like exists
    const like = await prisma.like.findFirst({
      where: {
        userID: req.user.id,
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
      await prisma.like.delete({
        where: {
          userID: req.user.id,
          postId: req.params.postId,
        },
      });

      res.json({ success: true, message: 'Post unliked.' });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }
  },
};
