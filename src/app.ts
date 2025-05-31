import dotenv from 'dotenv';
dotenv.config(); // ←

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import { errorHandler } from './middlewares/errorHandler';

import client from 'prom-client';
import './config/passport'; // 

const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);

app.use(errorHandler);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // 
  });

