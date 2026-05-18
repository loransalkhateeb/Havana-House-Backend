const { PrismaClient } = require("@prisma/client");
const path = require("path");

// Determine the correct database path based on runtime environment
let dbPath;

if (process.versions.electron) {
  // Running inside Electron
  const isPackaged = !process.defaultApp;
  dbPath = isPackaged
    ? path.join(path.dirname(process.execPath), 'dev.db')
    : path.join(__dirname, '../../prisma/dev.db');
} else {
  // Running as plain Node.js (npm run dev / npm start)
  dbPath = path.join(__dirname, '../../prisma/dev.db');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

module.exports = prisma;
