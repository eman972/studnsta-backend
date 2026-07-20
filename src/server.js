require("./config/env");

const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { createApp } = require("./app");
const { registerSockets } = require("./sockets");

async function bootstrap() {
  await connectDB();

  const { app, allowedOrigins } = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);
  registerSockets(io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return { app, server, io };
}

module.exports = { bootstrap };
