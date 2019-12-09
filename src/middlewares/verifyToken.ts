import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

export default (req: Request, res: Response, next: Function) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.slice(7);
        jwt.verify(
            token,
            process.env.jwtSecret as string,
            (err: Error, decoded: any) => {
                if (err)
                    return res.status(500).send({
                        auth: false,
                        message: 'Failed to authenticate token.',
                    });
                next();
            },
        );
    } else {
        return res
            .status(403)
            .send({ auth: false, message: 'No token provided.' });
    }
};