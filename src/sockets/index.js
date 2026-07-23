/**
 * Socket.io realtime handlers (live quiz lobby, chat rooms, presence channels)
 */
function registerSockets(io) {
  const liveLobbies = new Map();

  io.on("connection", (socket) => {
    socket.on("identify", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("join-class-chat", (classId) => {
      socket.join(`class:${classId}`);
    });

    socket.on("join-group", (groupId) => {
      socket.join(`group:${groupId}`);
    });



    socket.on("live-countdown", ({ quizId, seconds }) => {
      io.to(`live:${quizId}`).emit("live-countdown", { seconds });
    });

    socket.on("live-proctor-signal", ({ quizId, userId, signal }) => {
      io.to(`live:${quizId}`).emit("live-proctor-signal", {
        userId,
        signal,
        at: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      // Clean up lobbies if needed in future
    });
  });
}

module.exports = { registerSockets };
