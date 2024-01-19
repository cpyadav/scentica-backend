const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const cors = require('cors'); // Add this line
const dbConfig = require('./dbConfig');
const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';
const saltRounds = 10;
app.use(session({ secret: 'test123', resave: true, saveUninitialized: true }))
app.use(cors());
// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Routes

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userId = decoded.id;
        next();
    });
};
    
app.post('/signup', async (req, res) => {
    const data = req.body;

    try {
        // Hash and salt the password using bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
        // Insert user data into the database
        const insertQuery = `
            INSERT INTO users (firstname, lastname, email, jobtitle, phone, country, companyname, term_accepted, account_approved, password, reset_token, reset_token_expiry, status, created_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, NOW())
        `;
        const insertValues = [
            data.firstname,
            data.lastname,
            data.email,
            data.jobtitle,
            data.phone,
            data.country,
            data.companyname,
            data.term_accepted,
            data.account_approved,
            data.password,
            resetTokenExpiry,
            data.status
        ];
        // Execute the insert query
        const insertResults = await pool.query(insertQuery, insertValues);
        // Get the last inserted ID
        const lastInsertedId = insertResults && (insertResults.insertId || (insertResults && insertResults[0] && insertResults[0].insertId));
            // Generate JWT token
            const token = jwt.sign({ id: lastInsertedId }, secretKey, { expiresIn: '1h' });
            res.setHeader('Authorization', `Bearer ${token}`);
            // Create response object
            const objToken = {
                access_token: token,
                reset_token: data.reset_token,
                reset_token_expiry: resetTokenExpiry,
                status: data.status,
            };
            res.status(200).send({
                success: true,
                message: 'Client details created successfully',
                data: objToken
            });
        
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(500).send({
            success: false,
            message: 'Error creating user'
        });
    }
});

// app.post('/login', (req, res) => {
//     const { email, password } = req.body;

//     const query = 'SELECT * FROM users WHERE email = ?';
//     pool.query(query, [email], async (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }
//         if (results.length === 1) {
//             const user = results[0];

//             // Verify the password using bcrypt
//             const passwordMatch = await bcrypt.compare(password, user.password);

//             if (passwordMatch) {
//                 const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
//                 res.json({ token });
//             } else {
//                 res.status(401).json({ error: 'Invalid credentials' });
//             }
//         } else {
//             res.status(401).json({ error: 'Invalid credentials' });
//         }
//     });
// });
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Create a connection from the pool
    const connection = await pool.getConnection();

    try {
      // Execute a query using promises
      const [results] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);

        if (match) {
          const token = jwt.sign({ id: results[0].id }, secretKey, { expiresIn: '1h' });

          const objToken = {
            access_token: token,
            reset_token: results[0].reset_token,
            reset_token_expiry: results[0].reset_token_expiry,
            status: results[0].status,
          };

          res.setHeader('Authorization', `Bearer ${token}`);

          res.status(200).send({
            success: true,
            message: 'Login successful',
            data: objToken,
          });
        } else {
          res.status(401).send({
            success: false,
            message: 'Incorrect password',
          });
        }
      } else {
        res.status(404).send({
          success: false,
          message: 'User not found',
        });
      }
    } finally {
      // Always release the connection back to the pool, whether there was an error or not
      connection.release();
    }
  } catch (err) {
    console.error('Error fetching user: ', err.message);
    res.status(500).send({
      success: false,
      message: 'Error fetching user',
    });
  }
});

app.post('/login300', async(req, res) => {
    const {email, password} = req.body;
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if(err) {
            console.error('Error fetching user: ', err.message);
            res.status(500).send({
                success: false,
                message: 'Error fetching user'
            });
        }
        else if (results.length > 0) {
            const match =  await bcrypt.compare(password, results[0].password);
            if(match) {
                const token = jwt.sign({ id: results[0].id }, secretKey, { expiresIn: '1h' });
                res.setHeader('Authorization', `Bearer ${token}`);

                const objToken ={
                    access_token :token,
                    reset_token : results[0].reset_token,
                    reset_token_expiry:results[0].reset_token_expiry,
                    status: results[0].status,
                }
                //req.session.userId = results[0].id;
                
                res.status(200).send({
                    success: true,
                    message: 'Login successful',
                    data: objToken
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


app.get('/protected-route', async (req, res) => {
    // Get the token from the Authorization header
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Token not provided' });
    }

    try {
        // Verify the token and extract user ID
        const decoded = jwt.verify(token.split(' ')[1], secretKey);
        const userId = decoded.id;

        // You can now use the userId in your route logic

        res.status(200).json({
            success: true,
            message: 'Access granted',
            userId: userId
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

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
app.post('/client-data', async(req, res) => {
    const {user_id} = req.body;
    const query1 = `SELECT
    clent_briefing.*,
    GROUP_CONCAT(DISTINCT fragrance_smell.name ORDER BY fragrance_smell.id) AS smell_names,
    GROUP_CONCAT(DISTINCT fragrance_olfa_dir.name ORDER BY fragrance_olfa_dir.id) AS olfa_dir_names,
    GROUP_CONCAT(DISTINCT fragrance_ingredients.name ORDER BY fragrance_ingredients.id) AS ingredients_names,
    GROUP_CONCAT(DISTINCT fragrance_emotions.name ORDER BY fragrance_emotions.id) AS emotions_names,
    GROUP_CONCAT(DISTINCT fragrance_colors.name ORDER BY fragrance_colors.id) AS colors_names
FROM
clent_briefing
INNER JOIN
    fragrance_smell ON FIND_IN_SET(fragrance_smell.id, clent_briefing.smell)
INNER JOIN
    fragrance_olfa_dir ON FIND_IN_SET(fragrance_olfa_dir.id, clent_briefing.oflactive_dir)
INNER JOIN
    fragrance_ingredients ON FIND_IN_SET(fragrance_ingredients.id, clent_briefing.ingredients)
INNER JOIN
    fragrance_emotions ON FIND_IN_SET(fragrance_emotions.id, clent_briefing.emotions)
INNER JOIN
    fragrance_colors ON FIND_IN_SET(fragrance_colors.id, clent_briefing.colors)
WHERE
clent_briefing.user_id = 1
GROUP BY
clent_briefing.id;
 `;
 const query = `SELECT
    clent_briefing.*,
    GROUP_CONCAT(DISTINCT fragrance_smell.name ORDER BY fragrance_smell.id) AS smell_names,
    GROUP_CONCAT(DISTINCT fragrance_olfa_dir.name ORDER BY fragrance_olfa_dir.id) AS olfa_dir_names,
    GROUP_CONCAT(DISTINCT fragrance_ingredients.name ORDER BY fragrance_ingredients.id) AS ingredients_names,
    GROUP_CONCAT(DISTINCT fragrance_emotions.name ORDER BY fragrance_emotions.id) AS emotions_names,
    GROUP_CONCAT(DISTINCT fragrance_colors.name ORDER BY fragrance_colors.id) AS colors_names
FROM
clent_briefing
INNER JOIN
    fragrance_smell ON FIND_IN_SET(fragrance_smell.id, clent_briefing.smell)
INNER JOIN
    fragrance_olfa_dir ON FIND_IN_SET(fragrance_olfa_dir.id, clent_briefing.oflactive_dir)
INNER JOIN
    fragrance_ingredients ON FIND_IN_SET(fragrance_ingredients.id, clent_briefing.ingredients)
INNER JOIN
    fragrance_emotions ON FIND_IN_SET(fragrance_emotions.id, clent_briefing.emotions)
INNER JOIN
    fragrance_colors ON FIND_IN_SET(fragrance_colors.id, clent_briefing.colors)
WHERE
clent_briefing.user_id = 1
GROUP BY
clent_briefing.id;
 `;
    pool.query(`SELECT * FROM clent_briefing where user_id=${user_id}`, async (err, results) => {
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
  const { type, catId } = req.query;

  let query = 'SELECT * FROM category WHERE status = 1';

  if (type) {
    try {
      switch (type) {
        case 'category':
          query = 'SELECT * FROM category WHERE status = 1';
          break;
        case 'type':
          query = `SELECT * FROM product_types WHERE category=${catId} and status = 1`;
          break;
        case 'packaging':
          query = `SELECT * FROM product_packaging WHERE  category=${catId} and status = 1`;
          break;
        // ... other cases ...
        case 'formate':
        query = `SELECT * FROM product_formate WHERE category=${catId} and status = 1`;
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
            message: 'Invalid category type',
          });
          return;
      }

      // Execute the query using the promise-based API
      const results = await executeQuery(query);

      if (type === 'market') {
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

      if (type === 'ingredients') {
        for (let index = 0; index < results.length; index++) {
          const marketEntry = results[index];
          const locationQuery = `
            SELECT id, name, image
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
        data: results,
      });
    } catch (err) {
      console.error(`Error fetching ${type}: `, err.message);
      res.status(500).send({
        success: false,
        message: `Error fetching ${type}`,
      });
    }
  }
});

// Helper function to execute queries using promises
async function executeQuery(query) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query);
    return results;
  } catch (error) {
    console.error('Error executing query: ', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// app.get('/categorylist', async (req, res) => {
//     const { type,catId } = req.query;
//     let query = 'SELECT * FROM category WHERE status = 1';
//     if (type) {
//         switch (type) {
//             case 'category':
//                 query = 'SELECT * FROM category WHERE status = 1';
//                 break;
//             case 'type':
//                 query = `SELECT * FROM product_types WHERE category=${catId} and status = 1`;
//                 break;
//             case 'packaging':
//                 query = `SELECT * FROM product_packaging WHERE  category=${catId} and status = 1`;
//                 break;
//             case 'formate':
//                 query = `SELECT * FROM product_formate WHERE category=${catId} and status = 1`;
//                 break;
//             case 'market':
//                 query = 'SELECT * FROM product_market WHERE status = 1';
//                 break;
//             case 'ingredients':
//                 query = 'SELECT * FROM fragrance_ingredients WHERE status = 1';
//                 break;  
//             case 'emotions':
//                 query = 'SELECT * FROM fragrance_emotions WHERE status = 1';
//                 break;   
//             case 'colors':
//                 query = 'SELECT * FROM fragrance_colors WHERE status = 1';
//                 break;        
//             case 'oflactive_dir':
//                 query = 'SELECT * FROM fragrance_olfa_dir WHERE status = 1';
//                 break;                 
//             case 'smell':
//                 query = 'SELECT * FROM fragrance_smell WHERE status = 1';
//                 break;  
                
//             default:
//                 // Handle unknown type
//                 res.status(400).send({
//                     success: false,
//                     message: 'Invalid category type'
//                 });
//                 return;
//         }
//     }

//     function executeQuery(query) {
//         return new Promise((resolve, reject) => {
            
//             pool.query(query, (err, results) => {
//                 if (err) {
//                     console.error('Error executing query: ', err.message);
//                     reject(err);
//                 } else {
//                     resolve(results);
//                 }
//             });
//         });
//     }

//     try {
//         var results = await executeQuery(query);
//         if (type == 'market') {
//             for (let index = 0; index < results.length; index++) {
//                 const marketEntry = results[index];
//                 const locationQuery = `
//                     SELECT id, name
//                     FROM locations
//                     WHERE id IN (${marketEntry.location})
//                 `;

//                 // Execute the location query for each market entry
//                 const locationResults = await executeQuery(locationQuery);

//                 // Add location data to market entry
//                 results[index].location_data = locationResults;
//             }
//         }
//         if (type == 'ingredients') {
//             for (let index = 0; index < results.length; index++) {
//                 const marketEntry = results[index];
//                 const locationQuery = `
//                     SELECT id, name,image
//                     FROM fragrance_ingredients_images
//                     WHERE id IN (${marketEntry.ingradient_id})
//                 `;

//                 // Execute the location query for each market entry
//                 const locationResults = await executeQuery(locationQuery);

//                 // Add location data to market entry
//                 results[index].location_data = locationResults;
//             }
//         }
//         res.status(200).send({
//             success: true,
//             message: `Fetching ${type} successful`,
//             data: results
//         });
//     } catch (err) {
//         console.error(`Error fetching ${type}: `, err.message);
//         res.status(500).send({
//             success: false,
//             message: `Error fetching ${type}`
//         });
//     }
// });
// app.post('/save_client_briefing', async (req, res) => {
//     const data = req.body;
//     // Function to convert arrays to comma-separated strings only if present
//     const convertArraysToStrings = (obj) => {
//         for (const key in obj) {
//             if (Array.isArray(obj[key])) {
//                 obj[key] = obj[key].join(',');
//             } else if (typeof obj[key] === 'object') {
//                 convertArraysToStrings(obj[key]);
//             }
//         }
//     };
//     // Convert arrays to comma-separated strings only if present
//     convertArraysToStrings(data);

//     const query = `
//     INSERT INTO clent_briefing (user_id,company_name, industry, brand_vision, name, category, type, packaging, size, formate, market, price, benchmark, web_link, age_gp, gender, tg_user_occup, smell, oflactive_dir, ingredients, emotions, colors, dosage, price_range, ref_link,market_location,target_user_lifestyle,target_user_behaviour,status, created_date)
//     VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,1, NOW())
//   `;

//   const values = [
//     data.user_id,
//     data.company_name,
//     data.industry,
//     data.brand_vision,
//     data.name,
//     data.category,
//     data.type,
//     data.packaging,
//     data.size,
//     data.formate,
//     data.market,
//     data.price,
//     data.benchmark,
//     data.web_link,
//     data.age_gp,
//     data.gender,
//     data.tg_user_occup,
//     data.smell,
//     data.oflactive_dir,
//     data.ingredients,
//     data.emotions,
//     data.colors,
//     data.dosage,
//     data.price_range,
//     data.ref_link,
//     data.market_location,
//     data.target_user_lifestyle,
//     data.target_user_behaviour,
//   ];
//     pool.query(query, values, (err, results) => {
//         if(err) {
//             console.error('Error creating user: ', err.message)
//             res.status(500).send({
//                 success: false,
//                 message: 'Error creating user'
//             })
//         }
//         else {
//             res.status(200).send({
//                 success: true,
//                 message: 'Client details created successfully'
//             })
//         }
//     })
// })

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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
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

  try {
    const [results] = await pool.execute(query, values);
    res.status(200).send({
      success: true,
      message: 'Client details created successfully',
    });
  } catch (err) {
    console.error('Error creating user: ', err.message);
    res.status(500).send({
      success: false,
      message: 'Error creating user',
    });
  }
});

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

