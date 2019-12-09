import { Router } from 'express';
import { AuthController } from '../controller/AuthController';
import passport from '../middlewares/passport';

const api = Router();

api.post('/login', AuthController.login);

api.post('/changePassword', AuthController.checkPassword);

export default api;