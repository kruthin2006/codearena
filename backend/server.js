const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/admin', require('./routes/admin'));

// Start MongoDB In-Memory
let mongoServer;

async function startDatabase() {
  try {
    // Try to connect to real MongoDB first
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codearena', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
    });
    console.log('✅ Connected to MongoDB (Real)');
  } catch (error) {
    console.log('⚠️ Real MongoDB not available, using in-memory database...');
    
    // Fallback to in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB (In-Memory)');
    console.log('📝 Note: Data will be lost when server restarts');
    
    // Seed some initial data for testing
    await seedInitialData();
  }
}

// Seed initial data for testing
async function seedInitialData() {
  try {
    const User = require('./models/User');
    const Problem = require('./models/Problem');
    
    // Check if users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Create a test admin
      const admin = new User({
        username: 'admin',
        email: 'admin@codearena.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      
      // Create a test setter
      const setter = new User({
        username: 'setter',
        email: 'setter@codearena.com',
        password: 'setter123',
        role: 'setter'
      });
      await setter.save();
      
      // Create a test student
      const student = new User({
        username: 'student',
        email: 'student@codearena.com',
        password: 'student123',
        role: 'student'
      });
      await student.save();
      
      console.log('✅ Test users created:');
      console.log('  - Admin: admin/admin123');
      console.log('  - Setter: setter/setter123');
      console.log('  - Student: student/student123');
    }
    
    // Create a sample problem
    const problemCount = await Problem.countDocuments();
    if (problemCount === 0) {
      const problem = new Problem({
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
        sampleInput: 'nums = [2,7,11,15], target = 9',
        sampleOutput: '[0,1]',
        constraints: '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9',
        difficulty: 'Easy',
        testCases: [
          { input: '4\n2 7 11 15\n9', output: '0 1' },
          { input: '3\n3 2 4\n6', output: '1 2' },
          { input: '2\n3 3\n6', output: '0 1' }
        ],
        setter: (await User.findOne({ username: 'setter' }))._id
      });
      await problem.save();
      console.log('✅ Sample problem created: "Two Sum"');
    }
  } catch (error) {
    console.log('⚠️ Error seeding data:', error.message);
  }
}

// Start server
startDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(0);
});