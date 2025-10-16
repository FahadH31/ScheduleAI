const express = require("express");
const cors = require("cors");
const apiRoutes = require('./src/api_routes');

const app = express();
const port = process.env.PORT || 8070;

app.use(cors({
  exposedHeaders: ['Calendar-Action']}));
app.use(express.json());
app.use('/', apiRoutes);

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});