const config = require("./config");
const app = require("./app");
const prisma = require("./config/db");

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.env} mode`);
});

async function gracefulShutdown() {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
