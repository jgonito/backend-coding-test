/* global describe, before, it */
'use strict';

const assert = require('assert');
const request = require('supertest');
const db = require('../src/db');
const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');
const { validLat, validLong } = require('../src/utils');

describe('Util tests', () => {
    describe('validLat', () => {
        it('should return true if given value is between -90 and 90', (done) => {
            assert(validLat(-89) === true, `expect 'validLat(-89)' to be 'true'`);
            assert(validLat(89) === true, `expect 'validLat(90)' to be 'true'`);
            assert(validLat(-91) === false, `expect 'validLat(-90)' to be 'false'`);
            assert(validLat(91) === false, `expect 'validLat(91)' to be 'false'`);
            done();
        });
    });

    describe('validLong', () => {
        it('should return true if given value is between -180 and 180', (done) => {
            assert(validLong(-179) === true, `expect 'validLong(-179)' to be 'true'`);
            assert(validLong(179) === true, `expect 'validLong(179)' to be 'true'`);
            assert(validLong(-181) === false, `expect 'validLong(-181)' to be 'false'`);
            assert(validLong(181) === false, `expect 'validLong(181)' to be 'false'`);
            done();
        });
    });
});

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => { 
            if (err) {
                return done(err);
            }

            buildSchemas(db);
            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('POST /rides', () => {
        it('should return a VALIDATION_ERROR (start_lat=91)', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 91,
                    start_long: 180
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    assert(res.body.error_code === 'VALIDATION_ERROR', `expect a 'VALIDATION_ERROR' due to invalid 'start_lat' (91)`);
                    done();
                });
        });
        
        it('should return a VALIDATION_ERROR (end_lat=-91)', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 90,
                    start_long: 180,
                    end_lat: -91,
                    end_long: -180,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    assert(res.body.error_code === 'VALIDATION_ERROR', `expect a 'VALIDATION_ERROR' due to invalid 'end_lat' (-91)`);
                    done();
                });
        });
        
        it('should return a VALIDATION_ERROR (missing rider_name)', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 90,
                    start_long: 180,
                    end_lat: -90,
                    end_long: -180,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    assert(res.body.error_code === 'VALIDATION_ERROR', `expect a 'VALIDATION_ERROR' due to invalid 'rider_name'`);
                    done();
                });
        });

        it('should return the created ride', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 90,
                    start_long: 180,
                    end_lat: -90,
                    end_long: -180,
                    rider_name: 'Jane Doe',
                    driver_name: 'John Doe',
                    driver_vehicle: 'Car',
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    const createdRide = res.body[0];
                    assert(createdRide && typeof createdRide === 'object', `expect the 'createdRide' to be type 'object'`);
                    assert(createdRide.rideID > 0, `expect 'createdRide.rideID' to be greater than '0'`);
                    assert(createdRide.riderName === 'Jane Doe', `expect 'createdRide.riderName' to be 'Jane Doe'`);
                    assert(createdRide.driverName === 'John Doe', `expect 'createdRide.driverName' to be 'John Doe'`);
                    assert(createdRide.driverVehicle === 'Car', `expect 'createdRide.driverVehicle' to be 'Car'`);
                    done();
                });
        });
    });
    
    describe('GET /rides/', () => {
        before((done) => {
            db.run('DELETE FROM Rides', done);
        });

        it('should return a RIDES_NOT_FOUND_ERROR', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    assert(res.body.error_code === 'RIDES_NOT_FOUND_ERROR', `expect a 'RIDES_NOT_FOUND_ERROR' due to '0' query result`);
                    done();
                });
        });

        it('should return all rides', (done) => {
            for (let i = 0; i < 5; i ++) {
                let stmt = db.prepare('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)');
                stmt.run([
                    90,
                    180,
                    -90,
                    -180,
                    `Rider #${i + 1}`,
                    `Driver #${i + 1}`,
                    `Vehicle #${i + 1}`
                ]);
                stmt.finalize();
            }

            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    const rides = res.body;
                    assert(rides && rides instanceof Array, `expect 'rides' to be instance of 'Array'`);
                    assert(rides.length === 5, `expect 'rides.length' to be type '5'`);
                    done();
                });
        });
    });
    
    describe('GET /rides/{id}', () => {
        it(`should return a single ride`, (done) => {
            const rideID = 3;
            request(app)
                .get(`/rides/${rideID}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    const ride = res.body[0];
                    assert(ride && typeof ride === 'object', `expect 'ride' to be type 'object'`);
                    assert(ride.rideID === rideID, `expect 'ride.rideID' to be '${rideID}'`);
                    done();
                });
        });
    });
});