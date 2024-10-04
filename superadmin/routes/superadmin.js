// superadmin/routes/superadmin.js
var express = require('express');
const session = require('express-session');
var app = express();
var bodyParser = require('body-parser');
app.use(express.static(__dirname + "/../public"));
const router = express.Router();
app.use(express.static('public'));
const mongoose = require('mongoose');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const path = require('path');
const { MongoClient } = require('mongodb');
router.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  }));
  
  // Authorization Middleware
  function requireUser(req, res, next) {
    if (req.session.user && req.session.user.verify === "2") {
        next(); // User is authorized, continue to the next middleware or route handler
    } else {
        res.status(403).send('Unauthorized'); // User is not authorized
    }
  }

  
router.get('/', (req, res) => {
    const username = req.session.user.username;
    res.render(path.join(__dirname, '..', 'views', 'superadminportal'), { username: username });
});

// MongoDB connection
const url = 'mongodb://localhost:27017';
const dbName = 'edify';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connectDB();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/getUsers', async (req, res) => {
    const collectionName = 'users';
  
    try {
      const collection = db.collection(collectionName);
      const users = await collection.find({ verify: "0" }).toArray();
  
      res.render('userdetails1', { 
        users: users,
        username: req.session.user.username 
      });
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).send('Error retrieving users');
    }
  });
  
  router.post('/approveUser', async (req, res) => {
    const collectionName = 'users';
  
    try {
      const { empId, level } = req.body;
      const collection = db.collection(collectionName);
      
      await collection.updateOne({ empid: empId }, { $set: { verify: level } });
      res.status(200).send({ success: true });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).send({ success: false, message: 'Error approving user' });
    }
  });



router.get('/userdetails', async (req, res) => {
    const collectionName = 'users';

    try {
        const collection = db.collection(collectionName);
        const users = await collection.find({
            $or: [
                { verify: "1" },
                { verify: "2" }
            ]
        }).toArray();
        
        res.send(`
           <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Details</title>
    <link rel="icon" href="/icon.jpg">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #b8e7f9;
        }
        .main {
            margin: 0 auto;
            padding: 30px;
            background-color: #ececec;
            border-radius: 15px;
            box-shadow: 0 0 20px rgba(11, 1, 1, 0.2);
            width: 90%;
            max-width: 1000px;
        }
        .main h2 {
            color: #3f65c7;
            margin-bottom: 20px;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid #ccc;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        .submit1 {
            color: #ffffff;
            background-color: #1B4CFB;
            border: none;
            padding: 4% 8%;
            cursor: pointer;
        }
        a {
            float: right;
            margin-right: 3%;
        }
        .headtag {
            float: right;
        }
        .tag {
            margin-right: 2%;
            float: right;
        }
        .tag1 {
            margin-right: 0.5%;
            float: right;
        }
        .goback {
            position: fixed;
            right: 20px;
            bottom: 20px;
            height: 9%;
            width: 5%;
        }
    </style>
    <script>
        // Push a new state to the history stack
        history.pushState(null, null, location.href);

        window.addEventListener('popstate', function(event) {
            // Redirect to the logout endpoint or any other desired page
            window.location.href = '/superadmin/logout';
        });

        // Optional: Prevent default action for backspace key to avoid navigating back
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Backspace' && event.target.nodeName !== 'INPUT' && event.target.nodeName !== 'TEXTAREA') {
                event.preventDefault();
            }
        });
    </script>
    <script>
        function goBack() {
            window.location.href = '/superadmin';
        }
    </script>
</head>
<body>
    <div>
        <img src="/icon2.png" alt="" height="0%" width="15%" class="img1"> <br>
        <a href="/superadmin/logout"><img src="/logout.png" class="headtag"></a>
        <h3 class="tag">${req.session.user.username}</h3>
    </div> <br>
    <img class="tag1" src="/emp.webp" alt="loading" height="20px" width="30px"> <br>

    <br><h1 class="edify" align="center">EDIFY ENGINEERING SOLUTION</h1><br><br> <br><br>
    <div class="main">
        <h2 >User Details</h2>
        <table border="1">
            <thead>
                <tr>
                    <th>Sl No</th>
                    <th>User Name</th>
                    <th>Emp ID</th>
                    <th>Email</th>
                    <th>Level</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${users.map((user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${user.username}</td>
                        <td>${user.empid}</td>
                        <td>${user.email}</td>
                        <td>${user.verify === "1" ? 'User' : 'Admin'}</td>
                        <td><button class="submit1" style="background-color:red;" onclick="performAction('${user.empid}', '${user.verify}')">kickout</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    <img src="/goback.png" alt="loading" width="3%" height="5%" class="goback" onclick="goBack()">
    <script>
        function performAction(empId, verifyStatus) {
            let actionUrl = '/superadmin/approveUser'; // Default action URL for approval
            let actionText = 'approve'; // Default action text for approval

            if (verifyStatus === "2") {
                actionUrl = '/superadmin/kickoutUser'; // Change URL for kickout action
                actionText = 'kickout'; // Change action text for kickout
            }

            fetch(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ empId })
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      alert('User ' + actionText + 'd successfully');
                      location.reload(); // Reload the page to see the updated user list
                  } else {
                      alert('Error ' + actionText + 'ing user');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  alert('Error ' + actionText + 'ing user');
              });
        }
    </script>
</body>
</html>

`);
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send('Error retrieving users');
    }
});

// Route to handle kicking out a user
router.post('/kickoutUser', async (req, res) => {
    const { empId } = req.body;

    try {
        const collection = db.collection('users');
        const result = await collection.deleteOne({ empid: empId });

        if (result.deletedCount === 1 ) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'User not found or could not be deleted' });
        }
    } catch (error) {
        console.error('Error kicking out user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


  
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/'); // Redirect to the login page
    });
});

router.get('/status', async (req, res) => {
    try {
        const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);
        const collection = db.collection('info');
        const currentDate = new Date();
        const sevenDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));
        const sevenDaysAgoFormatted = sevenDaysAgo.toISOString().split('T')[0];
         const existingDocuments = await collection.find({}).toArray();
         const result = await collection.updateMany(
            { 
                date: { $lt: sevenDaysAgoFormatted }, 
                Status: { $ne: 'close1' }  // Exclude documents where status is 'close'
            },
            { $set: { status: 'overdue' } }  // Corrected typo from 'tatus' to 'status'
        );
       const statusEntries = await collection.find({}).toArray();

        res.render('111', { username: req.session.user.username, statusEntries });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data');
    }
});
router.get('/view/:id', async (req, res) => {
    const prId = req.params.id;
    const url = 'mongodb://localhost:27017';
    const dbName = 'edify';
    const collectionName = 'info';
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      const query = { Requisition: parseInt(prId) };
      const prDetails = await collection.findOne(query);
  
      if (!prDetails) {
        return res.status(404).json({ error: 'PR details not found' });
      }
  
      // Ensure the description field is an array
      const descriptions = Array.isArray(prDetails.description) ? prDetails.description : [];
      
      res.render('userform', { username:  req.session.user.username,descriptions, prDetails });
  
    } catch (error) {
      console.error('Error fetching PR details:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  });
router.get('/check/:id', async (req, res) => {
  const prId = req.params.id;
  const collectionName = 'info';
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const query = { Requisition: parseInt(prId) };
    const prDetails = await collection.findOne(query);

    if (!prDetails) {
      return res.status(404).json({ error: 'PR details not found' });
    }

    // Ensure the description field is an array
    const descriptions = Array.isArray(prDetails.description) ? prDetails.description : [];
    
    res.render('quotation2', { username:  req.session.user.username,descriptions, prDetails });

  } catch (error) {
    console.error('Error fetching PR details:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});


router.post('/submit1/:id', urlencodedParser, async (req, res) => {
    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url);
    const dbName = 'edify';
    const collectionName = 'info';
    const prId = req.params.id;

    try {
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const response = {
            part_Status: req.body.status,
            Remark: req.body.remark
        };

        // Determine the overall status based on part_Status array
        const overallStatus = response.part_Status.includes('Revise') ? 'Revise' : 'close';

        const query = { Requisition: parseInt(prId) };
        await collection.updateOne(query, { 
            $set: { 
                Status: overallStatus,
                updatedOn: formattedDate,
                ...response 
            } 
        });
        res.redirect('/superadmin/status');
    } catch (error) {
        console.error('Error during submission:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});



module.exports = router;
