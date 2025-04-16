const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  // Import the cors package
const Message = require('./models/Message');  // Import the Message model

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Enable CORS for all routes
app.use(cors());  // Add this line to enable CORS for all requests

// Define Routes
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/feed', require('./routes/feedRoutes'));
app.use('/api/barter', require('./routes/barterRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));

// Socket.IO Setup
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, content } = data;
        try {
            const newMessage = new Message({
                sender: senderId,
                receiver: receiverId,
                content,
            });
            const message = await newMessage.save();

            // Emit message to the receiver
            io.to(receiverId).emit('message', message);
            io.to(senderId).emit('message', message);
        } catch (err) {
            console.error(err.message);
        }
    });

    socket.on('joinRoom', (userId) => {
        socket.join(userId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
