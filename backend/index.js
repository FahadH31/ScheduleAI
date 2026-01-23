const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const apiRoutes = require('./src/api_routes');

const app = express();
const port = process.env.PORT || 8070;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // allows cookies to be sent
  exposedHeaders: ['Calendar-Action']
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    dbName: 'session-storage'
  }),
  httpOnly: true,
  saveUninitialized: false,
  resave: false
}))

app.use(express.json());
app.use('/', apiRoutes);

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});