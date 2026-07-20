const dotenv = require("dotenv");
const { ENV_PATH } = require("./paths");

dotenv.config({ path: ENV_PATH });

module.exports = process.env;
