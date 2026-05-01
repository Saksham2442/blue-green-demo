const express = require('express');
const app = express();
const VERSION = process.env.APP_VERSION || 'v1';
app.get('/', (req, res) => res.send(`Hello from ${VERSION} - Blue Green Demo!`));
app.listen(3000, () => console.log(`App ${VERSION} running on port 3000`));
