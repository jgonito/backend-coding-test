'use strict';

const express = require('express');
const app = express();

const rateLimit = require("express-rate-limit");
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({limit: '1mb'}); // limit payload to 1mb
const { logger, validLat, validLong } = require('./utils');

module.exports = (db) => {
    // MAX_REQUEST requests limit in 15 minutes
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: process.env.MAX_REQUEST
    }));

    app.get('/health', (req, res) => res.send('Healthy'));

    /**
     * @swagger
     * /rides/:
     *    post:
     *      description: Create a new ride
     *      parameters:
     *      - in: body
     *        name: ride
     *        description: The ride object payload
     *        required: true
     *        schema:
     *          $ref: '#/definitions/ride'
     *      responses:
     *        '200':
     *          description: Request successfully executed
     *        '500':
     *          description: An error is encountered while creating a ride
     * definitions:
     *   ride:
     *      description: The ride object payload
     *      properties:
     *        start_lat:
     *          type: number
     *          description: The start latitude
     *          example: 13.7565
     *        start_long:
     *          type: number
     *          description: The start longitude
     *          example: 121.0583
     *        end_lat:
     *          type: number
     *          description: The end latitude
     *          example: 14.6760
     *        end_long:
     *          type: number
     *          description: The end longitude
     *          example: 121.0437
     *        rider_name:
     *          type: string
     *          description: The name of the rider
     *          example: Jane Doe
     *        driver_name:
     *          type: string
     *          description: The name of the driver
     *          example: John Doe
     *        driver_vehicle:
     *          type: string
     *          description: The driver's vehicle
     *          example: Car
     */
    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (!validLat(startLatitude) || !validLong(startLongitude)) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 to 90 and -180 to 180 degrees respectively'
            });
        }

        if (!validLat(endLatitude) || !validLong(endLongitude)) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 to 90 and -180 to 180 degrees respectively'
            });
        }

        if (!riderName || riderName === '') {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (!driverName || driverName === '') {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }

        if (!driverVehicle || driverVehicle === '') {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver vehicle must be a non empty string'
            });
        }

        try {
            const { lastID } = await db.run(
                `INSERT INTO Rides (
                    startLat,
                    startLong,
                    endLat,
                    endLong,
                    riderName,
                    driverName,
                    driverVehicle
                ) VALUES (?,?,?,?,?,?,?)`,
                [
                    startLatitude,
                    startLongitude,
                    endLatitude,
                    endLongitude,
                    riderName,
                    driverName,
                    driverVehicle
                ]
            );
            const rows = await db.all('SELECT * FROM Rides WHERE rideID = ?', lastID);
            res.send(rows);
        } catch (err) {
            logger.error(err.message);
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });

    /**
     * @swagger
     * /rides/:
     *    get:
     *      description: Get all rides
     *      parameters:
     *      - in: query
     *        name: offset
     *        description: The number of records to skip
     *        example: 0
     *        schema:
     *          type: number
     *      - in: query
     *        name: limit
     *        description: The number of records to fetch
     *        example: 5
     *        schema:
     *          type: number
     *      responses:
     *        '200':
     *          description: Request successfully executed
     *        '500':
     *          description: An error is encountered while getting all rides
     */
    app.get('/rides', async (req, res) => {
        let sql = 'SELECT * FROM Rides';
        let offset = Number(req.query.offset) || 0;
        let limit = Number(req.query.limit);

        let sqlLimit = [];
        if (limit > 0) {
            sql += ' LIMIT ?,?'
            sqlLimit = [offset, limit]
        }

        try {
            const rows = await db.all(sql, sqlLimit);
            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }
            res.send(rows);
        } catch (err) {
            logger.error(err.message);
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });

    /**
     * @swagger
     * /rides/{id}:
     *    get:
     *      description: Get a ride by id
     *      parameters:
     *      - in: path
     *        name: id
     *        description: The id of ride
     *        required: true
     *        schema:
     *          type: integer
     *      responses:
     *        '200':
     *          description: Request successfully executed
     *        '500':
     *          description: An error is encountered while getting a ride
     */
    app.get('/rides/:id', async (req, res) => {
        try {
            const rows = await db.all('SELECT * FROM Rides WHERE rideID=?', req.params.id);
            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }
            res.send(rows);
        } catch (err) {
            logger.error(err.message);
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });

    return app;
};
