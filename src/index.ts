import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middlewares/cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import userRoutes from './routes/userRoutes';
import topicRoutes from './routes/topicRoutes';
import categoryRoutes from './routes/categoryRoutes';
import statisticRoutes from './routes/statisticRoutes'
import followRoutes from "./routes/followRoutes"
import forumRoutes from "./routes/forumRoutes"
import permissionRoutes from './routes/permissionRoutes'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/user', userRoutes);
app.use('/posts', topicRoutes);
app.use('/categories', categoryRoutes);
app.use('/statistic',  statisticRoutes)
app.use('/follow', followRoutes)
app.use('/forum', forumRoutes)
app.use('permission', permissionRoutes)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});