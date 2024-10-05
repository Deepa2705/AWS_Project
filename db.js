// db.js
const mongoose = require('mongoose');

const connectDB = async (uri) => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected');
        } else {
            console.log('Already connected to MongoDB');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
