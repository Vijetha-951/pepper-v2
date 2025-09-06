import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    dbName: undefined, // use db in URI
  });

  console.log('MongoDB connected');

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });
}