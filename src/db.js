const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

sqlite3.verbose();

module.exports = (async () => {
    return await open({
        filename: process.env.DB_NAME,
        driver: sqlite3.Database
    });
})();