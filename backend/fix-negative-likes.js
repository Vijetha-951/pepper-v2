import mongoose from 'mongoose';
import Video from './src/models/Video.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixNegativeLikes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find videos with negative likes
    const negativeLikes = await Video.find({ likes: { $lt: 0 } });
    console.log(`Found ${negativeLikes.length} videos with negative likes`);

    if (negativeLikes.length > 0) {
      // Fix them
      const result = await Video.updateMany(
        { likes: { $lt: 0 } },
        { $set: { likes: 0 } }
      );
      console.log(`✅ Fixed ${result.modifiedCount} videos`);
    }

    // Show all videos
    const allVideos = await Video.find();
    console.log('\n📹 Current video stats:');
    allVideos.forEach(video => {
      console.log(`  - ${video.title}: ${video.viewCount} views, ${video.likes} likes`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNegativeLikes();
