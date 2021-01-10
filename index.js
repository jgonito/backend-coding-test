'use strict';

(async () => {
    const { logger } = require('./src/utils');
    const swaggerJSDoc = require("swagger-jsdoc");
    const swaggerUI = require("swagger-ui-express");
    const buildSchemas = require('./src/schemas');
    const db = await require('./src/db');

    db.getDatabaseInstance().serialize();
    
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
    app.listen(port, () => logger.info(`App started and listening on port ${port}`));
})();