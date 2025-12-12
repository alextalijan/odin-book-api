const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  respondToRequest: async (req, res) => {
    // Check if the request exists
    const request = await prisma.followRequest.findUnique({
      where: {
        id: req.params.requestId,
      },
      select: {
        senderId: true,
        receiverId: true,
        status: true,
      },
    });
    if (!request) {
      return res.json({ success: false, message: 'Request does not exist.' });
    }

    // Check if the status is still pending
    if (request.status !== 'pending') {
      return res.json({
        success: false,
        message: 'Request already dealt with.',
      });
    }

    // Check if the user dealing with the request is the receiver
    if (req.user.id !== request.receiverId) {
      return res.json({
        success: false,
        message: 'Unauthorized to deal with this request.',
      });
    }

    // Deal with the request accordingly
    const possibleResponses = ['accepted', 'rejected'];
    if (!possibleResponses.includes(req.body.response)) {
      return res.json({
        success: false,
        message: 'Invalid response to the request.',
      });
    }

    await prisma.followRequest.update({
      where: {
        id: req.params.requestId,
      },
      data: {
        status: req.body.response,
      },
    });

    // If the request was accepted, add the follower to user
    if (req.body.response) {
      try {
        await prisma.following.create({
          data: {
            followerId: request.senderId,
            followedId: request.receiverId,
          },
        });
      } catch (err) {
        return res.json({
          success: false,
          message: 'Error adding the request sender to followers.',
        });
      }
    }

    res.json({ success: true, response: req.body.response });
  },
};
