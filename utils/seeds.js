const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { faker } = require('@faker-js/faker');

// Function that creates fake users
function createRandomUser() {
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    hash: faker.internet.password(),
  };
}

async function main() {
  // Find the id of alex
  const alex = await prisma.user.findUnique({
    where: {
      username: 'alex',
    },
    select: {
      id: true,
    },
  });

  // Create 5 fake users
  const users = faker.helpers.multiple(createRandomUser, {
    count: 5,
  });

  // For each user
  for (const user of users) {
    // Add user to the database
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        hash: user.hash,
      },
    });

    // Create fake post
    const post = await prisma.post.create({
      data: {
        text: `This is the first post made by ${user.username}.`,
        authorId: user.id,
        postedAt: faker.date.past(),
      },
      select: {
        id: true,
      },
    });

    // Add fake comments
    const numComments = Math.floor(Math.random() * 7);
    for (let i = 0; i < numComments; i++) {
      await prisma.comment.create({
        data: {
          text: `This is a random comment number ${i}`,
          postId: post.id,
          authorId: i < 4 ? users[i].id : alex.id,
        },
      });
    }

    // Set alex to follow them
    await prisma.following.create({
      data: { followedId: user.id, followerId: alex.id },
    });
  }
}

main();
