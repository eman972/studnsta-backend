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

    socket.on("live-lobby-join", ({ quizId, user }) => {
      socket.join(`live:${quizId}`);
      const list = liveLobbies.get(quizId) || [];
      if (!list.find((u) => u.id === user?.id)) {
        list.push({ id: user?.id, name: user?.name, socketId: socket.id });
        liveLobbies.set(quizId, list);
      }
      io.to(`live:${quizId}`).emit("live-lobby-update", liveLobbies.get(quizId));
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
      for (const [quizId, list] of liveLobbies.entries()) {
        const next = list.filter((u) => u.socketId !== socket.id);
        liveLobbies.set(quizId, next);
        io.to(`live:${quizId}`).emit("live-lobby-update", next);
      }
    });
  });
}

module.exports = { registerSockets };
