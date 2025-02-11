const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// MongoDB connection string
const mongoURI = 'mongodb://rappouser:Rappoauth147@35.154.91.9:27017/rappo_core?authSource=admin&readPreference=primary&ssl=false&directConnection=true';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the User schema
const userSchema = new mongoose.Schema({
  email: String,
});

// Create a model for the User collection
const User = mongoose.model('User', userSchema);

// Define the POST route for email search
app.post('/search', async (req, res) => {
  const email = req.body.email;

  try {
    // Search for the user by email and return only _id and email
    const user = await User.findOne({ email: email }).select('_id email');


    if (user) {
      // Store the user._id
      const userId = user._id;

      // Query images collection (replace `YourOtherCollection` with the actual collection name)
      const imageCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdBy._id": userId,
        "status": "finished",
        "type": "image"
      });


      // Query for video collection (replace `YourOtherCollection` with the actual collection name)
      const resultCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdBy._id": userId,
        "status": "finished",
        "type": "video"
      });


      // Query for last month videos collection (replace `YourOtherCollection` with the actual collection name)
      const lastMonthvideoCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdAt": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
        "createdBy._id": userId,
        "status": "finished",
        "type": "video"

      });


      // Query for last month images collection (replace `YourOtherCollection` with the actual collection name)
      const lastMonthimageCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdAt": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
        "createdBy._id": userId,
        "status": "finished",
        "type": "image"

      });
      const totalCredits = imageCount + (2 * resultCount);
      // Return the count of matching records along with the user ID
      res.json({
        status: 'success',
        data: {
          _id: user._id,
          email: user.email,
          recordCount: resultCount,
          imageCount: imageCount,
          lastMonthvideoCount: lastMonthvideoCount,
          lastMonthimageCount: lastMonthimageCount,
          totalCredits: totalCredits
        }
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error fetching user or querying data', error: error.message });
  }
});

// New route for filtering by date range
app.post('/getDataByDateRange', async (req, res) => {
  const { startDate, endDate, email } = req.body;

  try {
    // Search for the user by email and return only _id and email
    const user = await User.findOne({ email: email }).select('_id email');

    if (user) {
      const userId = user._id;

      // Parse the start and end date to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Query to get the image count within the date range
      const imageCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdBy._id": userId,
        "status": "finished",
        "type": "image",
        "createdAt": { $gte: start, $lte: end }
      });

      // Query to get the video count within the date range
      const videoCount = await mongoose.connection.db.collection('personalizerenders').countDocuments({
        "createdBy._id": userId,
        "status": "finished",
        "type": "video",
        "createdAt": { $gte: start, $lte: end }
      });

      // Calculate total credits
      const totalCredits = imageCount + (2 * videoCount);

      // Return the result
      res.json({
        status: 'success',
        data: {
          imageCount: imageCount,
          videoCount: videoCount,
          totalCredits: totalCredits,
        }
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error fetching data', error: error.message });
  }
});



// Serve the static files (frontend)
app.use(express.static('public'));

// Start the server
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
