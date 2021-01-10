const winston = require('winston');

const consoleLogger = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.simple()
    )
});

const fileLogger = new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

const fileErrorLogger = new winston.transports.File({
    level: 'error',
    filename: 'logs/error.log',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

module.exports = winston.createLogger({
    transports: [
        consoleLogger,
        fileErrorLogger,
        fileLogger
    ],
});

const validLat = (lat) => {
    return lat >= -90 && lat <= 90;
}

const validLong = (long) => {
    return long >= -180 && long <= 180;
}

module.exports = {
    logger: winston.createLogger({
        transports: [
            consoleLogger,
            fileLogger,
            fileErrorLogger
        ],
    }),
    validLat,
    validLong
}