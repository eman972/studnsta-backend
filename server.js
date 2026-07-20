/** Thin entrypoint — keeps `npm start` / nodemon stable at repo root */
require("./src/server")
  .bootstrap()
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
