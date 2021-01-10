'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {
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
    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
        
        const result = db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                res.send(rows);
            });
        });
    });

    /**
     * @swagger
     * /rides/:
     *    get:
     *      description: Get all rides
     *      responses:
     *        '200':
     *          description: Request successfully executed
     *        '500':
     *          description: An error is encountered while getting all rides
     */
    app.get('/rides', (req, res) => {
        db.all('SELECT * FROM Rides', function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
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
    app.get('/rides/:id', (req, res) => {
        db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });

    return app;
};
