import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { corsMiddleware } from './middlewares/cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(corsMiddleware);
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});