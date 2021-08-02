require('dotenv').config();

const express = require('express');
const compression = require('compression');
const https = require('https');
const http = require('http');
const fs = require('fs');

(async function() {
    const app = express();

    app.get('/', async function(req, res) {
        res.status(200).send();
    });

    app.use('/webhook', require('./webhook.js'));

    app.use(compression());
    app.use(express.json());

    app.use('*', async function(req, res) {
        res.status(404).json({error: 'no route found'});
    });
        
    if (process.env.HTTPS_PORT && process.env.SSL_CERTIFICATE_PATH && process.env.SSL_KEY_PATH) {
        const httpsOptions = {
            cert: fs.readFileSync(process.env.SSL_CERTIFICATE_PATH),
            key: fs.readFileSync(process.env.SSL_KEY_PATH)
        };

        https.createServer(httpsOptions, app).listen(process.env.HTTPS_PORT);
        http.createServer(express().use(function(req, res) {
            res.redirect(`https://${req.headers.host}${req.url}`);
        })).listen(process.env.PORT);
        console.log(`running https on port: ${process.env.HTTPS_PORT}, and redirecting http on port: ${process.env.PORT}...`);
    } else {
        http.createServer(app).listen(process.env.PORT);
        console.log(`running http on port: ${process.env.PORT}...`);
    }
})();