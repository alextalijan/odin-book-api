const express = require('express');

const app = express();
const PORT = 3000;

// Import routers
const userRouter = require('./routes/userRouter');

// Set up routers
app.use('/users', userRouter);

app.listen(PORT, (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('App listening to requests on port ' + PORT + '.');
});
