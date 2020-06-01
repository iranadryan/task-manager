const express = require('express');
const routes = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middlewares/auth');

routes.post('/tasks', authMiddleware, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json(err);
  }
});

routes.get('/tasks', authMiddleware, async (req, res) => {
  const match = {};
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sort) {
    const parts = req.query.sort.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      },
    }).execPopulate();

    res.json(req.user.tasks);
  } catch (err) {
    res.status(500).send();
  }
});

routes.get('/tasks/:id', authMiddleware, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.json(task);
  } catch (err) {
    res.status(400).send();
  }
});

routes.patch('/tasks/:id', authMiddleware, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid update' });
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => task[update] = req.body[update]);
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(400).json();
  }
});

routes.delete('/tasks/:id', authMiddleware, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.json(task);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = routes;
