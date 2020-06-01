const express = require('express');
const userRoutes = require('./routers/user');
const taskRoutes = require('./routers/task');
require('./db/mongoose');

const app = express();

app.use(express.json());
app.use(userRoutes);
app.use(taskRoutes);

app.listen(process.env.PORT);
