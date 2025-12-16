const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Set up cors
app.use(
  cors({
    origin: 'https://odin-book-frontend-alpha.vercel.app',
    credentials: true,
  })
);

// Set up cookie parser for incoming requests
app.use(cookieParser());

// Set up json parsing from incoming requests
app.use(express.json());

// Import routers
const indexRouter = require('./routes/indexRouter');
const userRouter = require('./routes/userRouter');
const postRouter = require('./routes/postRouter');
const requestRouter = require('./routes/requestRouter');

// Set up routers
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/posts', postRouter);
app.use('/requests', requestRouter);

// Set up the not found route
app.use((req, res) => {
  res.status(404).json({ message: 'API route does not exist' });
});

app.listen(PORT, (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('App listening to requests on port ' + PORT + '.');
});
