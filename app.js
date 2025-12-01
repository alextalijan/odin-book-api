const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Set up cors
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Set up cookie parser for incoming requests
app.use(cookieParser());

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
