const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const dbConfig = require('./dbConfig');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'test123', resave: true, saveUninitialized: true }))

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Routes
app.post('/signup', async (req, res) => {
    const {username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    pool.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hashedPassword], (err, results) => {
        if(err) {
            console.error('Error creating user: ', err.message)
            res.status(500).send({
                success: false,
                message: 'Error creating user'
            })
        }
        else {
            res.status(200).send({
                success: true,
                message: 'User created successfully'
            })
        }
    })
})

app.post('/login', async(req, res) => {
    const {username, password} = req.body;

    pool.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if(err) {
            console.error('Error fetching user: ', err.message);
            res.status(500).send({
                success: false,
                message: 'Error fetching user'
            });
        }
        else if (results.length > 0) {
            const match = await bcrypt.compare(password, results[0].password);
            if(match) {
                req.session.userId = results[0].id;
                res.status(200).send({
                    success: true,
                    message: 'Login successful'
                });
            }
            else {
                res.status(401).send({
                    success: false,
                    message: 'Incorrect password'
                });
            }
        }
        else {
            res.status(404).send({
                success: false,
                message: 'User not found'
            });
        }
    })
})

app.get('/all-users', async(req, res) => {
    pool.query('SELECT * FROM users', async (err, results) => {
        if(err) {
            console.error('Error fetching users: ', err.message);
            res.status(500).send({
                success: false,
                message: 'Error fetching users'
            });
        }
        else if (results.length > 0) {
                res.status(200).send({
                    success: true,
                    message: 'Fetching users successful',
                    data: results
                });
        }
        else {
            res.status(404).send({
                success: false,
                message: 'Empty list'
            });
        }
    })
})
app.get('/test', async (req, res) => {

    res.status(200).send({
        success: true,
        message: 'We are good !',
        data: results
    });


})
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})

