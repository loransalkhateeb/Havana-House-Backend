const { PrismaClient } = require("@prisma/client");
const path = require("path");

const isPackaged = !process.defaultApp;
const dbPath = isPackaged
  ? path.join(path.dirname(process.execPath), 'dev.db')
  : path.join(__dirname, '../../prisma/dev.db');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

module.exports = prisma;
