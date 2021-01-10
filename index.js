'use strict';

const express = require('express');
const app = express();
const port = 8010;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const db = require('./src/db');

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const buildSchemas = require('./src/schemas');

db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);
    
    const swaggerUISpecs = swaggerJSDoc({
        definition: {
            info: {
                title: 'Rides Management API',
                version: '1.0.0',
                description: 'A REST API service that allows user to manage rides',
                license: {
                    name: 'MIT',
                    url: 'https://spdx.org/licenses/MIT.html'
                },
                contact: {
                    name: 'Jerick Gonito',
                    email: 'jerickgonito@gmail.com'
                }
            }
        },
        apis: [
            './src/app.js'
        ]
    });

    app.use(
        '/',
        swaggerUI.serve,
        swaggerUI.setup(swaggerUISpecs, {
            customSiteTitle: 'Rides Management API - Documentation',
            customCss: '.swagger-ui .topbar { display: none }'
        })
    );

    const port = process.env.APP_PORT;
    app.listen(port, () => console.log(`App started and listening on port ${port}`));
});