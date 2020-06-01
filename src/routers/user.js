const express = require('express');
const sharp = require('sharp');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth');
const multerMiddleware = require('../middlewares/multer');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const routes = express.Router();

routes.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json(err);
  }
});

routes.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();

    res.json({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});

routes.post('/users/logout', authMiddleware, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(({ token }) => token !== req.token);
    await req.user.save();

    res.status(204).send();
  } catch (err) {
    res.status(500).send();
  }
});

routes.post('/users/logout-all', authMiddleware, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(204).send();
  } catch (err) {
    res.status(500).send();
  }
})

routes.get('/users/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

routes.patch('/users/me', authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid update' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    res.json(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

routes.delete('/users/me', authMiddleware, async (req, res) => {

  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);

    res.json(req.user);
  } catch (err) {
    res.status(500).send();
  }
});

routes.post('/users/me/avatar', authMiddleware, multerMiddleware.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();

  res.send();
}, (error, req, res, next) => {
  res.status(400).json({ error: error.message });
});

routes.delete('/users/me/avatar', authMiddleware, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();

  res.send();
});

routes.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
})

module.exports = routes;
