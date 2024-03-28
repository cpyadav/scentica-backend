const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const cors = require('cors'); // Add this line
const dbConfig = require('./dbConfig');
const nodemailer = require('nodemailer');
global.ReadableStream = require('readable-stream');
const puppeteer = require('puppeteer');
// const pdf = require('html-pdf');
const multer = require('multer');
const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' }); // Set the destination folder for uploaded files
const port = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key_20006';
const secretKeyAdmin = 'your_secret_key2024';
const saltRounds = 10;
app.use(session({ secret: 'test123', resave: true, saveUninitialized: true }))

// const corsOptions = {
//   origin: 'http://devstaging.in', // Replace with your frontend URL
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true, // Enable credentials (cookies, authorization headers)
//   optionsSuccessStatus: 204,
// };
const allowedOrigins = ['http://devstaging.in', 'http://admin.devstaging.in', 'http://api.devstaging.in'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Routes

  app.post('/send-email', async (req, res) => {
    try {
      const { to, subject, text } = req.body;
  
      // Generate PDF from HTML
      const pdfBuffer = await generatePDF();
  
      // Send email with PDF attachment
      await sendEmail(to, subject, text, pdfBuffer);
  
      res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  const generatePDF = async (data,userDetails) => {
    //const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      defaultViewport: null,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    // console.log("dddddd ===== ",data);
    // console.log("userDetails",userDetails);
    const htmlContent = `
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Client Briefing PDF</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }

          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
          }

          h1, h2, p {
            margin-bottom: 10px;
          }

          a {
            color: #3498db;
            text-decoration: none;
          }

          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Client Briefing PDF</h1>

          <h2>Client Details</h2>
          <p>User ID: ${data[0].user_id}</p>
          <p>Company Name: ${data[0].company_name}</p>
          <p>Industry: ${data[0].industry}</p>
          
          <!-- Add more user details as needed -->

          <h2>Product Details</h2>
          <p>Category: ${data[0].category_name}</p>
          <p>Type: ${data[0].type_name}</p>
          <p>age_gp: ${data[0].age_gp}</p>
          <!-- Add more product details as needed -->

          <h2>Smell Information</h2>
          ${data[0].smell.map(smell => `<p>Smell: ${smell.name}</p>`).join('')}

          <!-- Add more smell information as needed -->

          <h2>Emotions Information</h2>
          ${data[0].emotions.map(emotion => `<p>Emotion: ${emotion.name}</p>`).join(' | ')}

          <!-- Add more emotions information as needed -->

          <!-- Add more sections for other data (oflactive_dir, ingredients, colors, etc.) -->

        </div>
      </body>
    </html>
  `;
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf();
    await browser.close();
    return pdfBuffer;
  };
  
  const sendEmail = async (to, subject, text, pdfBuffer) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cpyadav2010@gmail.com', // replace with your email
        pass: 'rmds ekus bdmt erqf', // replace with your password or App Password
      },
    });
  
    const mailOptions = {
      from: 'cpyadav2010@gmail.com',
      to: to,
      subject: subject,
      text: text,
      attachments: [
        {
          filename: 'document.pdf',
          content: pdfBuffer,
        },
      ],
    };
  
    await transporter.sendMail(mailOptions);
  };
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
const verifyTokenAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
      return res.status(403).json({ error: 'Token not provided' });
  }

  jwt.verify(token, secretKeyAdmin, (err, decoded) => {
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

app.post('/adminlogin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await pool.getConnection();

    try {
      const [results] = await connection.execute('SELECT * FROM admin WHERE email = ?', [email]);

      if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);

        if (match) {
          const token = jwt.sign({ id: results[0].id }, secretKeyAdmin, { expiresIn: '1h' });

          res.setHeader('Authorization', `Bearer ${token}`);

          res.status(200).send({
            success: true,
            message: 'Admin Login successful',
            data: {
              access_token: token,
              status: results[0].status,
            },
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
      connection.release();
    }
  } catch (err) {
    console.error('Error during admin login: ', err.message);
    res.status(500).send({
      success: false,
      message: 'Error during admin login',
    });
  }
});


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


app.get('/categorylist', async (req, res) => {
  const { type, catId,saerchParams } = req.query;

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
      if (saerchParams && saerchParams !== '') {
        query += ` AND name LIKE '%${saerchParams}%'`;
      }
      // Execute the query using the promise-based API
      const results = await executeQuery(query);

      if (type === 'market') {
        for (let index = 0; index < results.length; index++) {
          const marketEntry = results[index];
          if(marketEntry && marketEntry.location !=''){
            const locationQuery = `
            SELECT id, name
            FROM locations
            WHERE id IN (${marketEntry.location})
          `;
          // Execute the location query for each market entry
          const locationResults = await executeQuery(locationQuery);
          // Add location data to market entry
          results[index].location_data = locationResults;
          }else{
            results[index].location_data = [];
          }
          
        }
      }

      if (type === 'ingredients') {
        for (let index = 0; index < results.length; index++) {
          const marketEntry = results[index];
          if (marketEntry && marketEntry.ingradient_id != '') {
            const locationQuery = `
            SELECT id, name, image
            FROM fragrance_ingredients_images
            WHERE id IN (${marketEntry.ingradient_id})
          `;
            // Execute the location query for each market entry
            const locationResults = await executeQuery(locationQuery);
            // Add location data to market entry
            results[index].location_data = locationResults;
          } else {
            results[index].location_data = [];
          }

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

async function executeQueryIN(query) {
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
async function sendEmailWithPDF(data , userDetails) {
  try {
    // Generate PDF from HTML
    const pdfBuffer = await generatePDF(data,userDetails);

    // Send email with PDF attachment userDetails.email
    //console.log(userDetails);
    await sendEmail(userDetails.email, subject='tets email', data='text', pdfBuffer);

    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error(error);
    throw new Error('Internal Server Error');
  }
}
const getClientDataById = async (userId, clientId) => {
  let query = `SELECT
      y.id,
      y.user_id,
      y.company_name,
      y.industry,
      y.brand_vision,
      y.name,
      y.category,
      y.type,
      y.packaging,
      y.size,
      y.formate,
      pf.name AS formate_name,
      pt.name AS type_name,
      c.name AS category_name,
      y.market,
      y.price,
      y.benchmark,
      y.web_link,
      y.age_gp,
      y.gender,
      y.tg_user_occup,
      y.smell,
      y.oflactive_dir,
      y.ingredients,
      y.emotions,
      y.colors,
      y.dosage,
      y.price_range,
      y.ref_link,
      y.market_location,
      y.target_user_lifestyle,
      y.target_user_behaviour,
      y.status,
      y.created_date
  FROM
      clent_briefing y
  INNER JOIN
      product_formate pf ON y.formate = pf.id
  INNER JOIN
      product_types pt ON y.type = pt.id
  INNER JOIN
      category c ON y.category = c.id
  WHERE
      y.user_id = 1`;

  if (clientId) {
    query += ` AND y.id = ${clientId}`;
  }

  query += ` ORDER BY created_date DESC`;
console.log("query",query);

  const results = await executeQuery(query);

  try {
    const modifiedResults = await Promise.all(results.map(async (result) => {
      const oflactiveDirArray = result.oflactive_dir ? result.oflactive_dir.split(',').map(Number) : [];

      let oflactive_Query = [];
      if (result.oflactive_dir) {
        const oflactive_dirQuery = `SELECT * FROM fragrance_olfa_dir WHERE status = 1 AND id IN (${result.oflactive_dir})`;
        oflactive_Query = await executeQueryIN(oflactive_dirQuery);
      }

      let smellData = [];
      if (result && result.smell) {
        const smellDataQuery = `SELECT * FROM fragrance_smell WHERE status = 1 AND id IN (${result.smell})`;
        smellData = await executeQueryIN(smellDataQuery);
      }

      let colorsData = [];
      if (result && result.colors) {
        const colorsDataQuery = `SELECT * FROM fragrance_colors WHERE status = 1 AND id IN (${result.colors})`;
        colorsData = await executeQueryIN(colorsDataQuery);
      }

      let emotionsData = [];
      if (result && result.emotions) {
        const emotionsDataQuery = `SELECT * FROM fragrance_emotions WHERE status = 1 AND id IN (${result.emotions})`;
        emotionsData = await executeQueryIN(emotionsDataQuery);
      }

      let ingredientsData = [];
      if (result && result.ingredients) {
        const ingredientsDataQuery = `SELECT * FROM fragrance_ingredients WHERE status = 1 AND id IN (${result.ingredients})`;
        ingredientsData = await executeQueryIN(ingredientsDataQuery);
        if (ingredientsData && ingredientsData.length > 0) {
          var modifiedResultsIngradients = await Promise.all(ingredientsData.map(async (resultingradients) => {
            let ingradientsImg = [];
            if (resultingradients && resultingradients.ingradient_id) {
              const ingradientsImageQuery = `SELECT * FROM fragrance_ingredients_images WHERE status = 1 AND id IN (${resultingradients.ingradient_id})`;
              ingradientsImg = await executeQueryIN(ingradientsImageQuery);
            }
            return {
              ...resultingradients,
              ingradientsImg: ingradientsImg
            };
          }));
        }
      }

      return {
        ...result,
        oflactive_dir: oflactive_Query,
        emotions: emotionsData,
        colors: colorsData,
        smell: smellData,
        ingredients: modifiedResultsIngradients
      };

    }));

    return {
      success: true,
      message: clientId ? 'Fetching data successful for a specific client' : 'Fetching data successful for all clients',
      data: modifiedResults,
    };
  } catch (err) {
    console.error('Error fetching data', err.message);
    return {
      success: false,
      message: 'Error fetching data',
    };
  }
};

app.get('/all-client-data', async (req, res) => {
    const {clientId } = req.query;
    if(clientId){
       var query = `SELECT
      y.id,
      y.user_id,
      y.company_name,
      y.industry,
      y.brand_vision,
      y.name,
      y.category,
      y.type,
      y.packaging,
      y.size,
      y.formate,
      pf.name AS formate_name,
      pt.name AS type_name,
      c.name AS category_name,
      y.market,
      y.price,
      y.benchmark,
      y.web_link,
      y.age_gp,
      y.gender,
      y.tg_user_occup,
      y.smell,
      y.oflactive_dir,
      y.ingredients,
      y.emotions,
      y.colors,
      y.dosage,
      y.price_range,
      y.ref_link,
      y.market_location,
      y.target_user_lifestyle,
      y.target_user_behaviour,
      y.status,
      y.created_date
  FROM
      clent_briefing y
  INNER JOIN
      product_formate pf ON y.formate = pf.id
  INNER JOIN
      product_types pt ON y.type = pt.id
  INNER JOIN
      category c ON y.category = c.id
  WHERE
      y.user_id = 1 and y.id=${clientId} `;
    }else {
      var query = `SELECT
    y.id,
    y.user_id,
    y.company_name,
    y.industry,
    y.brand_vision,
    y.name,
    y.category,
    y.type,
    y.packaging,
    y.size,
    y.formate,
    pf.name AS formate_name,
    pt.name AS type_name,
    c.name AS category_name,
    y.market,
    y.price,
    y.benchmark,
    y.web_link,
    y.age_gp,
    y.gender,
    y.tg_user_occup,
    y.smell,
    y.oflactive_dir,
    y.ingredients,
    y.emotions,
    y.colors,
    y.dosage,
    y.price_range,
    y.ref_link,
    y.market_location,
    y.target_user_lifestyle,
    y.target_user_behaviour,
    y.status,
    y.created_date
FROM
    clent_briefing y
INNER JOIN
    product_formate pf ON y.formate = pf.id
INNER JOIN
    product_types pt ON y.type = pt.id
INNER JOIN
    category c ON y.category = c.id
WHERE
    y.user_id = 1 order by created_date desc `;
    }
    // Execute the query using the promise-based API
    const results = await executeQuery(query);
    try {
      const modifiedResults = await Promise.all(results.map(async (result) => {
        // Extract the "oflactive_dir" string and split it into an array
        const oflactiveDirArray = result.oflactive_dir ? result.oflactive_dir.split(',').map(Number) : [];
         
        // Fetch additional data for "oflactive_dir" from the fragrance_smell table
       let  oflactive_Query  =[];
        if(result.oflactive_dir){
          const oflactive_dirQuery = `SELECT * FROM fragrance_olfa_dir WHERE status = 1 AND id IN (${result.oflactive_dir})`;
           oflactive_Query = await executeQueryIN(oflactive_dirQuery);
        }
        let smellData =[];
         if(result && result.smell){
          const smellDataQuery = `SELECT * FROM fragrance_smell WHERE status = 1 AND id IN (${result.smell})`;
           smellData = await executeQueryIN(smellDataQuery);
         }
         
         let colorsData =[];
         if(result && result.colors){ 
         const colorsDataQuery = `SELECT * FROM fragrance_colors WHERE status = 1 AND id IN (${result.colors})`;
          colorsData = await executeQueryIN(colorsDataQuery);
         }
         let emotionsData=[];
        if(result && result.emotions){
          const emotionsDataQuery = `SELECT * FROM fragrance_emotions WHERE status = 1 AND id IN (${result.emotions})`;
           emotionsData = await executeQueryIN(emotionsDataQuery);
        }
        let ingredientsData=[];
        if(result && result.ingredients){
          const ingredientsDataQuery = `SELECT * FROM fragrance_ingredients WHERE status = 1 AND id IN (${result.ingredients})`;
          ingredientsData = await executeQueryIN(ingredientsDataQuery);
          if (ingredientsData && ingredientsData.length > 0) {
            var modifiedResultsIngradients = await Promise.all(ingredientsData.map(async (resultingradients) => {
             let  ingradientsImg =[]
              if(resultingradients && resultingradients.ingradient_id){
                const ingradientsImageQuery = `SELECT * FROM fragrance_ingredients_images WHERE status = 1 AND id IN (${resultingradients.ingradient_id})`;
                ingradientsImg = await executeQueryIN(ingradientsImageQuery);
              }
              return {
              ...resultingradients,
              ingradientsImg:ingradientsImg
            };
            }));
          }
        }
        
        
        // Add the new data to the result object
        return {
            ...result,
            oflactive_dir: oflactive_Query,
            emotions: emotionsData,  // Add your logic to fetch emotions data
            colors: colorsData,    // Add your logic to fetch colors data
            smell: smellData,  
            ingredients: modifiedResultsIngradients   // Add your logic to fetch smell data
        };
  
      }));
        res.status(200).send({
            success: true,
            message: `Fetching  data successful`,
            data: modifiedResults,
        });
    } catch (err) {
        console.error(`Error fetching data`, err.message);
        res.status(500).send({
            success: false,
            message: `Error fetching `,
        });
    }
}
);
async function getClientData(clientId,userId) {
  let query;
  if (clientId !='') {
    query = `
      SELECT
        y.id,
        y.user_id,
        y.company_name,
        y.industry,
        y.brand_vision,
        y.name,
        y.category,
        y.type,
        y.packaging,
        y.size,
        y.formate,
        pf.name AS formate_name,
        pt.name AS type_name,
        c.name AS category_name,
        y.market,
        y.price,
        y.benchmark,
        y.web_link,
        y.age_gp,
        y.gender,
        y.tg_user_occup,
        y.smell,
        y.oflactive_dir,
        y.ingredients,
        y.emotions,
        y.colors,
        y.dosage,
        y.price_range,
        y.ref_link,
        y.market_location,
        y.target_user_lifestyle,
        y.target_user_behaviour,
        y.status,
        y.created_date
      FROM
        clent_briefing y
      INNER JOIN
        product_formate pf ON y.formate = pf.id
      INNER JOIN
        product_types pt ON y.type = pt.id
      INNER JOIN
        category c ON y.category = c.id
      WHERE
        y.user_id = ${userId} and y.id=${clientId}`;
  } else {
    query = `
      SELECT
        y.id,
        y.user_id,
        y.company_name,
        y.industry,
        y.brand_vision,
        y.name,
        y.category,
        y.type,
        y.packaging,
        y.size,
        y.formate,
        pf.name AS formate_name,
        pt.name AS type_name,
        c.name AS category_name,
        y.market,
        y.price,
        y.benchmark,
        y.web_link,
        y.age_gp,
        y.gender,
        y.tg_user_occup,
        y.smell,
        y.oflactive_dir,
        y.ingredients,
        y.emotions,
        y.colors,
        y.dosage,
        y.price_range,
        y.ref_link,
        y.market_location,
        y.target_user_lifestyle,
        y.target_user_behaviour,
        y.status,
        y.created_date
      FROM
        clent_briefing y
      INNER JOIN
        product_formate pf ON y.formate = pf.id
      INNER JOIN
        product_types pt ON y.type = pt.id
      INNER JOIN
        category c ON y.category = c.id
      WHERE
        y.user_id = ${userId}
      ORDER BY y.created_date DESC`;
  }
  const results = await executeQuery(query);
  const modifiedResults = await Promise.all(results.map(async (result) => {
    const oflactiveDirArray = result.oflactive_dir ? result.oflactive_dir.split(',').map(Number) : [];
    const oflactiveDirQuery = await executeQueryIN(`SELECT * FROM fragrance_olfa_dir WHERE status = 1 AND id IN (${oflactiveDirArray})`);
    const smellData = await executeQueryIN(`SELECT * FROM fragrance_smell WHERE status = 1 AND id IN (${result.smell})`);
    const colorsData = await executeQueryIN(`SELECT * FROM fragrance_colors WHERE status = 1 AND id IN (${result.colors})`);
    const emotionsData = await executeQueryIN(`SELECT * FROM fragrance_emotions WHERE status = 1 AND id IN (${result.emotions})`);
    let ingredientsData = [];

    if (result.ingredients) {
      const ingredientsDataQuery = `SELECT * FROM fragrance_ingredients WHERE status = 1 AND id IN (${result.ingredients})`;
      ingredientsData = await executeQueryIN(ingredientsDataQuery);

      if (ingredientsData && ingredientsData.length > 0) {
        ingredientsData = await Promise.all(ingredientsData.map(async (resultingradients) => {
          const ingradientsImg = await executeQueryIN(`SELECT * FROM fragrance_ingredients_images WHERE status = 1 AND id IN (${resultingradients.ingradient_id})`);

          return {
            ...resultingradients,
            ingradientsImg: ingradientsImg,
          };
        }));
      }
    }

    return {
      ...result,
      oflactive_dir: oflactiveDirQuery,
      emotions: emotionsData,
      colors: colorsData,
      smell: smellData,
      ingredients: ingredientsData,
    };
  }));

  return modifiedResults;
}

function getHeaderToken(req) {
  const authorizationHeader = req.header('Authorization');
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.replace('Bearer ', '');
  }
  return null;
}
function getUserIdFromAccessToken(accessToken, secretKey) {
  try {
    const decoded = jwt.verify(accessToken, secretKey);
    console.log(decoded);
    return decoded.id;
  } catch (err) {
    console.error('Error verifying access token: ', err.message);
    return null;
  }
}
async function getUserDetails(userId) {
  try {
    const query = 'SELECT * FROM users WHERE id = ?'; // Change 'users' to your actual table name
    const [results] = await pool.execute(query, [userId]);

    if (results.length > 0) {
      const userDetails = results[0];
      return userDetails;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    throw new Error('Error fetching user details');
  }
}

app.post('/save_client_briefing', async (req, res) => {
  const data = req.body;
  const accessToken = getHeaderToken(req);
  if (!accessToken) {
    return res.status(401).send({
      success: false,
      message: 'Authorization token not provided',
    });
  }
  const userId = getUserIdFromAccessToken(accessToken, secretKey);
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

  // const query = `
  //   INSERT INTO clent_briefing (user_id,company_name, industry, brand_vision, name, category, type, packaging, size, formate, market, price, benchmark, web_link, age_gp, gender, tg_user_occup, smell, oflactive_dir, ingredients, emotions, colors, dosage, price_range, ref_link,market_location,target_user_lifestyle,target_user_behaviour,status, created_date)
  //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
  // `;

  // const values = [
  //   data.user_id || '',
  //   data.company_name || '',
  //   data.industry || '',
  //   data.brand_vision || '',
  //   data.name || '',
  //   data.category || '',
  //   data.type || '',
  //   data.packaging || '',
  //   data.size || '',
  //   data.formate || '',
  //   data.market || '',
  //   data.price || '',
  //   data.benchmark || '',
  //   data.web_link || '',
  //   data.age_gp || '',
  //   data.gender || '',
  //   data.tg_user_occup || '',
  //   data.smell || '',
  //   data.oflactive_dir || '',
  //   data.ingredients || '',
  //   data.emotions || '',
  //   data.colors || '',
  //   data.dosage || '',
  //   data.price_range || '',
  //   data.ref_link || '',
  //   data.market_location || '',
  //   data.target_user_lifestyle || '',
  //   data.target_user_behaviour || '',
  // ];
  const columns = Object.keys(data).join(', ');
  const placeholders = Array(Object.keys(data).length).fill('?').join(', ');

  const query = `
    INSERT INTO clent_briefing (user_id,${columns}, status, created_date)
    VALUES (${userId},${placeholders}, 1, NOW())
  `;
  const values = Object.values(data);
  try {
    const [results] = await pool.execute(query, values);
    const lastInsertedId = results.insertId;
    if(lastInsertedId && lastInsertedId !=''){
      const dataLast = await getClientData(lastInsertedId,userId);
      //console.log("dataLast",dataLast)
      const userDetails = await getUserDetails(userId);
      const sendEmailPdf = await sendEmailWithPDF(dataLast,userDetails);
      //console.log(sendEmailPdf);
      //sendEmailWithPDF
      res.status(200).send({
        success: true,
        data: dataLast,
        message: 'Client details created successfully',
      });
    }else{
      res.status(404).send({
        success: false,
        message: 'Error in data'
      });
    }
    

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


app.get('/admincategorylist', async (req, res) => {
  const { type, catId } = req.query;

  let query = 'SELECT * FROM category ';

  if (type) {
    try {
      switch (type) {
        case 'category':
          query = 'SELECT * FROM category';
          break;
        case 'type':
          query = `SELECT * FROM product_types`;
          break;
        case 'packaging':
          query = `SELECT * FROM product_packaging`;
          break;
        // ... other cases ...
        case 'formate':
        query = `SELECT * FROM product_formate`;
        break;
        case 'market':
            query = 'SELECT * FROM product_market';
            break;
        case 'ingredients':
            query = 'SELECT * FROM fragrance_ingredients';
            break; 
        case 'ingredientscontent':
          query = 'SELECT * FROM fragrance_ingredients_images';
          break;         
        case 'emotions':
            query = 'SELECT * FROM fragrance_emotions';
            break;   
        case 'colors':
            query = 'SELECT * FROM fragrance_colors';
            break;        
        case 'oflactive_dir':
            query = 'SELECT * FROM fragrance_olfa_dir';
            break;   
        case 'industry':
          query = 'industry';   
          break;                      
        case 'smell':
            query = 'SELECT * FROM fragrance_smell';
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
          if(marketEntry.location !=''){
            const locationQuery = `
            SELECT id, name
            FROM locations
            WHERE id IN (${marketEntry.location})
          `;
          // Execute the location query for each market entry
          const locationResults = await executeQuery(locationQuery);

          // Add location data to market entry
          results[index].location_data = locationResults;
          }else{
            results[index].location_data = [];
          }
          
        }
      }

      if (type === 'ingredients') {
        for (let index = 0; index < results.length; index++) {
          const marketEntry = results[index];
          if (marketEntry.ingradient_id != '') {
            const locationQuery = `
            SELECT id, name, image
            FROM fragrance_ingredients_images
            WHERE id IN (${marketEntry.ingradient_id})
          `;

            // Execute the location query for each market entry
            const locationResults = await executeQuery(locationQuery);

            // Add location data to market entry
            results[index].location_data = locationResults;
          }else{
            results[index].location_data = [];
          }

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

// add new api 
app.post('/addnewProduct/:type/', upload.array('images', 10), async (req, res) => {
  const type = req.params.type;
  const prod_name = req.body.name;
  const category = req.body &&  req.body.category ? req.body.category  : '';
  const images = req &&  req.files != undefined ? req.files : []; // This contains information about the uploaded images
  try {
      let tableName;
      switch (type) {
        case 'category':
          tableName = 'category';
          break;
        case 'type':
          tableName = 'product_types';
          break;
        case 'packaging':
          tableName = `product_packaging`;
          break;
        case 'formate':
          tableName = `product_formate`;
          break;
        case 'market':
          tableName = 'product_market';
          break;
        case 'ingredientscontent':
          tableName = 'fragrance_ingredients_images';
          break;
        case 'emotions':
          tableName = 'fragrance_emotions';
          break;
        case 'colors':
          tableName = 'fragrance_colors';
          break;
        case 'oflactive_dir':
          tableName = 'fragrance_olfa_dir';
          break;
        case 'smell':
          tableName = 'fragrance_smell';
        break;  
        // Add more cases for different types if needed
        default:
              tableName = '';
      }
    if (category) {
      var insertQuery = `
        INSERT INTO ${tableName} (category,name, image, status, created_date)
        VALUES (?, ?, ?, '1', NOW())
    `;
    } else {
      var insertQuery = `
        INSERT INTO ${tableName} (name, image, status, created_date)
        VALUES (?, ?, '1', NOW())
    `;
    }

    const results = [];

    for (let i = 0; i < prod_name.length; i++) {
      const name = prod_name[i];
      const image = images && images.length> 0 ? images[i].filename : '';
      if (category) {
        var insertValues = [
          category,
          name,
          image,
        ];
      } else {
        var insertValues = [
          name,
          image,
        ];
      }
      const insertResult = await pool.query(insertQuery, insertValues);
      results.push(insertResult);
    }

    const queryCategory = `SELECT * FROM ${tableName}`;
    const resultData = await executeQuery(queryCategory);
    if (results && results.length > 0) {
      res.status(200).send({
        success: true,
        message: 'data updated successfully',
        data: resultData,
      });
    } else {
      res.status(500).send({
        success: false,
        message: 'Error updating category',
      });
    }
      
  } catch (error) {
      console.error('Error creating categories:', error.message);
      res.status(500).send({
          success: false,
          message: 'Error creating categories',
      });
  }
});

app.post('/updateProduct/:type/:id', upload.array('images',10), async (req, res) => {
  const type = req.params.type;
  const id = req.params.id;
  const productName = req.body.name;
  const imagename = req.files;

  try {
    let tableName;
    switch (type) {
      case 'category':
        tableName = 'category';
        break;
      case 'type':
        tableName = 'product_types';
        break;
      case 'packaging':
        tableName = 'product_packaging';
        break;
      case 'formate':
        tableName = 'product_formate';
        break;
      case 'market':
        tableName = 'product_market';
        break;
      case 'ingredients':
        tableName = 'fragrance_ingredients_images';
        break;
      case 'emotions':
        tableName = 'fragrance_emotions';
        break;
      case 'colors':
        tableName = 'fragrance_colors';
        break;
      case 'oflactive_dir':
        tableName = 'fragrance_olfa_dir';
        break;
      case 'smell':
        tableName = 'fragrance_smell';
        break;
      // Add more cases for different types if needed
      default:
        tableName = '';
    }

    if (tableName) {
    
        try {
          let updateQuery;
          let updateValues;
    
          if (imagename && imagename[0] && imagename[0].filename) {
              // If an image is uploaded, update both name and image
              updateQuery = `
                  UPDATE ${tableName}
                  SET name = ?, image = ?, status = '1'
                  WHERE id = ?;
              `;
              updateValues = [
                productName,
                  imagename[0].filename, // Save the new filename in the database
                  id,
              ];
          } else {
              // If no image is uploaded, update only the name
              updateQuery = `
                  UPDATE ${tableName}
                  SET name = ?, status = '1'
                  WHERE id = ?;
              `;
              updateValues = [
                productName,
                  id,
              ];
          }    
          // Execute the update query
          const updateResults = await pool.query(updateQuery, updateValues);
          
          if (updateResults) {
              const queryCategory =  `SELECT * FROM ${tableName} WHERE status = 1`;
              const results = await executeQuery(queryCategory);
              res.status(200).send({
                  success: true,
                  message: 'data updated successfully',
                  data: results,
              });
          } else {
              res.status(500).send({
                  success: false,
                  message: 'Error updating category',
              });
          }
      } catch (error) {
          console.error('Error updating category:', error.message);
          res.status(500).send({
              success: false,
              message: 'Error updating category',
          });
      }


    } else {
      res.status(400).send({
        success: false,
        message: 'Invalid type specified',
      });
    }
  } catch (error) {
    console.error('Error updating categories:', error.message);
    res.status(500).send({
      success: false,
      message: 'Error updating categories',
    });
  }
});

app.post('/deleteProduct/:type/:id', async (req, res) => {
  const type = req.params.type;
  const id = req.params.id;
  try {
      let tableName;
      switch (type) {
        case 'category':
          tableName = 'category';
          break;
        case 'type':
          tableName = 'product_types';
          break;
        case 'packaging':
          tableName = `product_packaging`;
          break;
        case 'formate':
          tableName = `product_formate`;
          break;
        case 'market':
          tableName = 'product_market';
          break;
        case 'ingredients':
          tableName = 'fragrance_ingredients';
          break;
        case 'ingredientscontent':
          tableName = 'fragrance_ingredients_images';
          break;   
        case 'emotions':
          tableName = 'fragrance_emotions';
          break;
        case 'colors':
          tableName = 'fragrance_colors';
          break;
        case 'oflactive_dir':
          tableName = 'fragrance_olfa_dir';
          break;
          case 'industry':
            tableName = 'industry';
            break;  
        case 'smell':
          tableName = 'fragrance_smell';
          break;   
        // Add more cases for different types if needed
        default:
              tableName = '';
      }
      if (tableName) {
        const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
  
        // Execute the delete query
        const deleteResult = await pool.query(deleteQuery, [id]);
        if(deleteResult){
        const queryCategory =  `SELECT * FROM ${tableName} WHERE status = 1`;
        const results = await executeQuery(queryCategory);

        res.status(200).send({
          success: true,
          message: 'deleted successfully',
          data: results,
        });
      }else{
        res.status(400).send({
          success: false,
          message: 'Invalid type specified',
          data: [],
        });  
      }
      } else {
        res.status(400).send({
          success: false,
          message: 'Invalid type specified',
        });
      }

  } catch (error) {
      console.error('Error creating categories:', error.message);
      res.status(500).send({
          success: false,
          message: 'Error creating categories',
      });
  }
});

app.get('/categoryingradients', async (req, res) => {
  let query = 'SELECT * FROM fragrance_ingredients';
    try {
      // Execute the query using the promise-based API
      
      const results = await executeQuery(query);
      res.status(200).send({
        success: true,
        message: `Fetching ingradient successful`,
        data: results,
      });
      
    } catch (err) {
      console.error(`Error fetching ingradient: `, err.message);
      res.status(500).send({
        success: false,
        message: `Error fetching ingradient`,
      });
    }
});
app.post('/assigningradients', async (req, res) => {
  const { id,ingradient_id} = req.body;
  let updateQuery ;
  let updateValues;
  updateQuery = `
  UPDATE fragrance_ingredients
  SET ingradient_id = ?, status = '1'
  WHERE id = ?;
`;
updateValues = [
  ingradient_id,
  id,
];
const updateResults = await pool.query(updateQuery, updateValues);

    try {
      let query = 'SELECT * FROM fragrance_ingredients';
      const results = await executeQuery(query);

      // Execute the query using the promise-based API
      res.status(200).send({
        success: true,
        message: `Update data  successful`,
        data: results,
      });
      
    } catch (err) {
      console.error(`Error fetching data: `, err.message);
      res.status(500).send({
        success: false,
        message: `Error fetching data`,
      });
    }
});

app.get('/getindustry', async (req, res) => {
  let query = 'SELECT * FROM industry';
    try {
      // Execute the query using the promise-based API
      const results = await executeQuery(query);
      res.status(200).send({
        success: true,
        message: `Fetching ingradient successful`,
        data: results,
      });
    } catch (err) {
      console.error(`Error fetching ingradient: `, err.message);
      res.status(500).send({
        success: false,
        message: `Error fetching ingradient`,
      });
    }
});
app.post('/addnewIndustry/', async (req, res) => {
  const prod_name = req.body.name;
  try {
      const insertQuery = `
          INSERT INTO industry (name, status, created_at)
          VALUES (?, '1', NOW())
      `;
      const insertValues = [
        prod_name,
        
    ];
    const insertResult = await pool.query(insertQuery, insertValues);
      if(insertResult){
        const queryCategory =  `SELECT * FROM industry ORDER BY created_date DESC`;
        const results = await executeQuery(queryCategory);
        res.status(200).send({
          success: true,
          message: 'Categories created successfully',
          data: results,
      });
      }
  } catch (error) {
      console.error('Error creating categories:', error.message);
      res.status(500).send({
          success: false,
          message: 'Error creating categories',
      });
  }
});
app.post('/addnewIngradient/',upload.array('name'), async (req, res) => {
  const prod_name = req.body.name;
  try {
      var insertQuery = `
          INSERT INTO fragrance_ingredients (name, ingradient_id, status, created_date)
          VALUES (?,'', '1', NOW())
      `;
    const results = [];

    for (let i = 0; i < prod_name.length; i++) {
      const name = prod_name[i];     
        var insertValues = [
          name
        ];
      const insertResult = await pool.query(insertQuery, insertValues);
      results.push(insertResult);
    }

    const queryCategory = `SELECT * FROM fragrance_ingredients`;
    const resultData = await executeQuery(queryCategory);
    if (resultData && resultData.length > 0) {
      res.status(200).send({
        success: true,
        message: 'data updated successfully',
        data: resultData,
      });
    } else {
      res.status(500).send({
        success: false,
        message: 'Error updating category',
      });
    }

  } catch (error) {
      console.error('Error creating categories:', error.message);
      res.status(500).send({
          success: false,
          message: 'Error creating categories',
      });
  }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})

