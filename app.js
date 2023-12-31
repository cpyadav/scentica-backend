const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const cors = require('cors'); // Add this line
const dbConfig = require('./dbConfig');
const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'test123', resave: true, saveUninitialized: true }))
app.use(cors());
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

app.get('/categorylist', async (req, res) => {
    const { type } = req.query;

    let query = 'SELECT * FROM category WHERE status = 1';
    if (type) {
        switch (type) {
            case 'category':
                query = 'SELECT * FROM category WHERE status = 1';
                break;
            case 'type':
                query = 'SELECT * FROM product_types WHERE status = 1';
                break;
            case 'packaging':
                query = 'SELECT * FROM product_packaging WHERE status = 1';
                break;
            case 'formate':
                query = 'SELECT * FROM product_formate WHERE status = 1';
                break;
            case 'market':
                query = 'SELECT * FROM product_market WHERE status = 1';
                break;
            case 'ingredients':
                query = 'SELECT * FROM fragrance_ingredients WHERE status = 1';
                break;  
            case 'emotions':
                query = 'SELECT * FROM fragrance_emotions WHERE status = 1';
                break;   
            case 'colors':
                query = 'SELECT * FROM fragrance_colors WHERE status = 1';
                break;        
            case 'oflactive_dir':
                query = 'SELECT * FROM fragrance_olfa_dir WHERE status = 1';
                break;                 
            case 'smell':
                query = 'SELECT * FROM fragrance_smell WHERE status = 1';
                break;  
                
            default:
                // Handle unknown type
                res.status(400).send({
                    success: false,
                    message: 'Invalid category type'
                });
                return;
        }
    }

    function executeQuery(query) {
        return new Promise((resolve, reject) => {
            console.log(pool);
            pool.query(query, (err, results) => {
                if (err) {
                    console.error('Error executing query: ', err.message);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    try {
        var results = await executeQuery(query);
        console.log("query +++++++",query);
        if (type == 'market') {
            for (let index = 0; index < results.length; index++) {
                const marketEntry = results[index];
                const locationQuery = `
                    SELECT id, name
                    FROM locations
                    WHERE id IN (${marketEntry.location})
                `;

                // Execute the location query for each market entry
                const locationResults = await executeQuery(locationQuery);

                // Add location data to market entry
                results[index].location_data = locationResults;
            }
        }
        if (type == 'ingredients') {
            for (let index = 0; index < results.length; index++) {
                const marketEntry = results[index];
                const locationQuery = `
                    SELECT id, name,image
                    FROM fragrance_ingredients_images
                    WHERE id IN (${marketEntry.ingradient_id})
                `;

                // Execute the location query for each market entry
                const locationResults = await executeQuery(locationQuery);

                // Add location data to market entry
                results[index].location_data = locationResults;
            }
        }
        res.status(200).send({
            success: true,
            message: `Fetching ${type} successful`,
            data: results
        });
    } catch (err) {
        console.error(`Error fetching ${type}: `, err.message);
        res.status(500).send({
            success: false,
            message: `Error fetching ${type}`
        });
    }
});
app.post('/save_client_briefing', async (req, res) => {
    const data = req.body;
    // Function to convert arrays to comma-separated strings only if present
    const convertArraysToStrings = (obj) => {
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key] = obj[key].join(',');
            } else if (typeof obj[key] === 'object') {
                convertArraysToStrings(obj[key]);
            }
        }
    };
    // Convert arrays to comma-separated strings only if present
    convertArraysToStrings(data);

    const query = `
    INSERT INTO clent_briefing (user_id,company_name, industry, brand_vision, name, category, type, packaging, size, formate, market, price, benchmark, web_link, age_gp, gender, tg_user_occup, smell, oflactive_dir, ingredients, emotions, colors, dosage, price_range, ref_link,market_location,target_user_lifestyle,target_user_behaviour,status, created_date)
    VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,1, NOW())
  `;

  const values = [
    data.user_id,
    data.company_name,
    data.industry,
    data.brand_vision,
    data.name,
    data.category,
    data.type,
    data.packaging,
    data.size,
    data.formate,
    data.market,
    data.price,
    data.benchmark,
    data.web_link,
    data.age_gp,
    data.gender,
    data.tg_user_occup,
    data.smell,
    data.oflactive_dir,
    data.ingredients,
    data.emotions,
    data.colors,
    data.dosage,
    data.price_range,
    data.ref_link,
    data.market_location,
    data.target_user_lifestyle,
    data.target_user_behaviour,
  ];
    pool.query(query, values, (err, results) => {
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
                message: 'Client details created successfully'
            })
        }
    })
})
app.get('/test', async (req, res) => {
    let query = 'SELECT * FROM category WHERE status = 1';
    pool.query(query, async (err, results) => {
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
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})

