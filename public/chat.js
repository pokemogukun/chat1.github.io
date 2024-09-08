const socket = io();

// メッセージ送信ボタン
document.getElementById('send-button').addEventListener('click', () => {
  const message = document.getElementById('message-input').value;
  socket.emit('chat message', message);
  document.getElementById('message-input').value = '';
});

// メッセージ受信
socket.on('chat message', (msg) => {
  const messages = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.textContent = msg;
  messages.appendChild(messageElement);
});
