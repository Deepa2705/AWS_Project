const express = require('express');
const session = require('express-session');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const UserHistory = require('../../models/UserHistory'); // Correct path to the UserHistory model
// Middleware
router.use(bodyParser.urlencoded({ extended: true }));
router.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Authorization Middleware
function requireUser(req, res, next) {
    if (req.session.user && req.session.user.verify === "1") {
        next(); // User is authorized, continue to the next middleware or route handler
    } else {
        res.status(403).send('Unauthorized'); // User is not authorized
    }
}


// Routes
router.get('/login', (req, res) => {
    // Render your login form here
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Example logic to authenticate user (replace with your actual authentication logic)
    if (username === 'admin' && password === 'password') {
        // Generate a requisition number
        const requisitionNumber = await generateRequisitionNumber();
        // Store requisition number in session
        req.session.requisitionNumber = requisitionNumber;
        // Mocking user session data
        req.session.user = {
            username: username,
            verify: "1"
        };
        res.redirect('/user/dashboard'); // Redirect to user dashboard or any other route
    } else {
        res.status(401).send('Authentication failed'); // Handle authentication failure
    }
});

router.get('/dashboard', requireUser, (req, res) => {
    // Render dashboard with requisition number
    const requisitionNumber = req.session.requisitionNumber || 'N/A';
    res.render('dashboard', { requisitionNumber });
});

router.get('/prform', requireUser, async (req, res) => {
   
        const username = req.session.user.username;
        res.render('prform', {  username: username });
});


const url = 'mongodb://localhost:27017';
const dbName = 'edify';

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

      res.render('1', { username: req.session.user.username, statusEntries });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data');
  }
});

router.get('/check/:id', requireUser, async (req, res) => {
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
    
    res.render('quotation', { username:  req.session.user.username,descriptions, prDetails });

  } catch (error) {
    console.error('Error fetching PR details:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});








router.get('/co', requireUser, (req, res) => {
         const username = req.session.user.username;
        res.render('userportal', {  username: username });
});


router.post('/save', urlencodedParser, async (req, res) => {
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`; // Format: dd-mm-yyyy
   
  
    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url);
    const dbName = 'edify';
    const collectionName = 'draft';
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      const response = {
         date:formattedDate,
          Customer: req.body.Customer,
          Requisitor: req.session.user.username,
          Pro_id: req.body.Pro_id,
          Part_No: req.body.part_no,
          description: req.body.description,
          manufacture: req.body.manufacture,
          supplier: req.body.supplier,
          Qty: req.body.qty,
          Need_by_date: req.body.NEED,
          rate:req.body.Rate,
          total:req.body.Total,
          files:req.body.quote_pdf,
          part_Status:req.body.status,
          Remark:req.body.remark


        };
  
  
      await collection.insertOne(response);
      const username = req.session.user.username;
      res.render('userportal', { username: username});
    } catch (error) {
      console.error('Error during sbmission:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  });

  router.post('/submit', urlencodedParser, async (req, res) => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // Format: dd-mm-yyyy
  
    const url = 'mongodb://localhost:27017';
    const dbName = 'edify';
    const collectionName = 'info';
    const client = new MongoClient(url);
  
    try {
      await client.connect();
      
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      const latestNumber = await collection.countDocuments();
      const Requisitionnum = latestNumber + 1;
  
      // Collecting data from the request body
      const response = {
        Requisition:Requisitionnum,
         Status:req.body.status1,
         date:formattedDate,
          Customer: req.body.Customer,
          Requisitor: req.session.user.username,
          Pro_id: req.body.Pro_id,
          Part_No: req.body.part_no,
          description: req.body.description,
          manufacture: req.body.manufacture,
          supplier: req.body.supplier,
          Qty: req.body.qty,
          Need_by_date: req.body.NEED,
          rate:req.body.Rate,
          total:req.body.Total,
          files:req.body.quote_pdf,
          part_Status:req.body.status,
          Remark:req.body.remark
      };
  
      await collection.insertOne(response);
      res.redirect(`/user/details/${Requisitionnum}`);
     
    } catch (error) {
      console.error('Error during submission:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  });
  
  router.get('/details/:id', requireUser, async (req, res) => {
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
  
      // Render detailed PR information
      let htmlResponse = `
        <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PR Details</title>
      <link rel="icon" href="/icon.jpg">
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #b8e7f9;
          }
          .main {
              margin: 0 auto;
              padding: 20px;
              background-color: #ececec;
              border-radius: 15px;
              box-shadow: 0 0 20px rgba(190, 156, 18, 0.2);
              width: 90%;
          }
          .main h2 {
              color: #3f65c7;
              margin-bottom: 20px;
          }
          label {
              display: block;
              margin-bottom: 5px;
              color: #555;
              font-weight: bold;
          }
          table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
          }
          table, th, td {
              border: 1px solid #ccc;
          }
          .no-border-table, .no-border-table th, .no-border-table td {
              border: none;
          }
          th, td {
              padding: 8px;
              text-align: left;
          }
          .submit, button {
              background-color: #094af1;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
          }
          .submit:hover, button:hover {
              background-color: #2f4aa8;
          }
          #csvFileInput {
              display: none;
          }
          .goback {
              position: fixed;
              right: 20px;
              bottom: 20px;
          }
          .dateformat{
              padding-left: 6%;
              padding-right: 6%;
              border: 1px solid black;
          }
          .span1{
          color:#D8089D;
          }
          
      </style>
      <script>
         
      
          // Push a new state to the history stack
          history.pushState(null, null, location.href);
      
          window.addEventListener('popstate', function(event) {
              window.location.href = '/user/logout';
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
              window.location.href = '/user';
          }
      </script>
  </head>
  <body>
      <div>
          <img src="/icon2.png" alt="" height="0%" width="15%">
          <h1 class="edify" align="center">EDIFY ENGINEERING SOLUTION</h1>
      </div>
      <div class="main">
          <h2>Purchase Request Received </h2>
          <h2>Requisition #:<span class="span1">${prDetails.Requisition}</span></h2>
          <form id="purchaseForm" >
              <table class="no-border-table">
                  <tr>
                     <td><label for="Customer">Customer Name:</label></td>
                      <td><input type="text" name="Customer" required value="${prDetails.Customer}" disabled></td>
                      <td><label for="date">Date:</label></td>
                      <td><input type="text" name="date" required value="${prDetails.date}" disabled></td>
                  </tr>
                  <tr>
  
                      <td><label for="Pro_id">Project Id:</label></td>
                      <td><input type="text" name="Pro_id" required value="${prDetails.Pro_id}" disabled></td>    
                      <td><label for="Requisitor">Requisitor:</label></td>
                      <td><input type="text" name="Requisitor" required value="${prDetails.Requisitor}" disabled></td>
                       
                      
                  </tr>
              </table>
              <table id="dataTable">
                  <thead>
                      <tr>
                          <th>Sl No</th>
                          <th>Part No</th>
                          <th>Description</th>
                          <th>Manufacture No</th>
                          <th>Supplier</th>
                          <th>Need by Date</th>
                          <th>Qty</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${descriptions.map((desc, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td><input type="text" class="part_no" name="part_no[]" value="${prDetails.Part_No[index]}" disabled></td>
                          <td><input type="text" class="description" name="description[]" value="${prDetails.description[index]}" required disabled></td>
                          <td><input type="text" class="manufacture" name="manufacture[]" value="${prDetails.manufacture[index]}" disabled></td>
                          <td><input type="text" class="supplier" name="supplier[]" value="${prDetails.supplier[index]}" disabled></td>
                          <td><input type="text" class="NEED" name="NEED[]" value="${prDetails.Need_by_date[index]}" disabled></td>
                          <td><input type="number" class="qty" name="qty[]" min="1" value="${prDetails.Qty[index]}" required disabled></td>
                        </tr>
                      `).join('')}
                  </tbody>
              </table>
               <buttonstyle="background-color: #b8e7f9;"><img src="/goback.png" alt="loading" width="3%" height="5%" class="goback"  onclick="goBack()" ></button>
          </form>
      </div>
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  </body>
  </html>
  
  
      `;
      res.send(htmlResponse);
    } catch (error) {
      console.error('Error fetching PR details:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  });
  





  
  

  router.get('/viewpr', async (req, res) => {
    const url = 'mongodb://localhost:27017';
    const dbName = 'edify';
    const collectionName = 'draft';
    
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      const username = req.session.user.username;
      const query =  ({ Requisitor:username });
      const pendingPRs = await collection.find(query).toArray();
  
  
      let htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pending PR</title>
          <link rel="icon" href="/icon.jpg">
          <style>
            body { font-family: Arial, sans-serif; background-color: #b8e7f9; }
            .main { margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 15px; box-shadow: 0 0 20px rgba(190, 156, 18, 0.2); width: 90%; }
            .main h2 { color: #3f65c7; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table, th, td { border: 1px solid #ccc; }
            th, td { text-align: center; padding: 8px; }
            .button1 { background-color: #094af1; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            .button1:hover { background-color: #2f4aa8; }
            .goback { position: fixed; right: 20px; bottom: 20px; height: 9%; width: 5%; }
            a { text-decoration: none; color: black; }
             .headtag{
            float:right;
        }
        .tag{
            margin-right: 2%;
            float:right;
        }
        .tag1{
            margin-right: 0.5%;
            float:right;
        }
          </style>
        </head>
        <body>
           <div>
        <img src="/icon2.png" alt="" height="0%" width="15%" class="img1"> <br>
       <a href="/user/logout" ><img src="/logout.png"  class="headtag"></a>
      <h3 class="tag" >${req.session.user.username} </h3></div> <br>
      <img  class="tag1" src="/emp.webp" alt="loading"  height="20px"width="30px"> <br> <br> <br> <br> 
      
 <br> <br><h1  class="edify" align="center">EDIFY ENGINEERING SOLUTION</h1>
 <br> 
          <div class="main">
            <h2>Purchase Requisition Draft</h2>
            <table id="dataTable">
              <thead>
                <tr>
                <th>Sl No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Project Id</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
      `;
  
      // Append each PR to the HTML response
      pendingPRs.forEach((pr,index) => {
        htmlResponse += `
          <tr>
             <td>${index+1}</td>
            <td>${pr.date}</td>
            <td>${pr.Customer}</td>
            <td>${pr.Pro_id}</td>
            <td><button class="button1"><a href="/user/viewpr/details/${pr._id}">View</a></button></td>
          </tr>
        `;
      });
  
      // Close the HTML structure
      htmlResponse += `
              </tbody>
            </table>
          </div>
          <img src="/goback.png" alt="loading" width="3%" height="5%" class="goback" onclick="goBack()">
          <script>
            function goBack() {
              window.history.back();
            }
          </script>
        </body>
        </html>
      `;
  
      // Send the HTML response to the client
      res.send(htmlResponse);
  
    } catch (error) {
      console.error('Error fetching pending PRs:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  });
  
 




  router.get('/viewpr/details/:id', async (req, res) => {
    const url = 'mongodb://localhost:27017';
    const dbName = 'edify';
    const collectionName = 'draft';
    
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
    const prId = req.params.id;
  
    try {
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
  
      // Query MongoDB to fetch details by _id
      const query = { _id: ObjectId(prId) };
      const prDetails = await collection.findOne(query);
  
      if (!prDetails) {
        return res.status(404).json({ error: 'PR details not found' });
      }
  
      // Ensure the description field is an array
      const descriptions = Array.isArray(prDetails.description) ? prDetails.description : [];
       res.render('viewpr-details', {
        username: req.session.user.username,
        prDetails: prDetails,
        descriptions: descriptions
    });
    await collection.deleteOne(query);

    } catch (error) {
      console.error('Error fetching PR details:', error);
      res.status(500).send('Internal Server Error');
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
  

module.exports = router;
