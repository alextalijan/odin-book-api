const express = require('express');

const app = express();
const PORT = 3000;

app.listen(PORT, (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('App listening to requests on port ' + PORT + '.');
});
