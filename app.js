const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Set up cors
app.use(cors());

// Set up json parsing from incoming requests
app.use(express.json());

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
