const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB接続設定
mongoose.connect('mongodb+srv://<username>:<password>@cluster0.mongodb.net/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => console.log(err));

// ユーザーモデルのスキーマ
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  chatHistory: [{ message: String, timestamp: Date }],
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

// パスワードをハッシュ化する関数
const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// パスワード検証の関数
const verifyPassword = async (password, hashedPassword) => {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
};

// ユーザー登録
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    res.status(500).send('Error registering user');
  }
});

// ログイン
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).send('User not found');

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) return res.status(401).send('Invalid password');

    res.status(200).send('Login successful');
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

// メッセージ送信
app.post('/send-message', async (req, res) => {
  const { username, message } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send('User not found');

    user.chatHistory.push({ message, timestamp: new Date() });
    await user.save();
    res.status(200).send('Message saved');
  } catch (err) {
    res.status(500).send('Error sending message');
  }
});

// チャット履歴を取得
app.get('/chat-history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send('User not found');

    res.status(200).json(user.chatHistory);
  } catch (err) {
    res.status(500).send('Error retrieving chat history');
  }
});

// Socket.io接続
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
