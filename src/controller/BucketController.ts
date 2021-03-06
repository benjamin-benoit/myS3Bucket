import { getRepository, Repository } from 'typeorm';
import { Request, Response } from 'express';
import { Bucket } from '../entity/Bucket';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import {
    createDirectoryAction,
    removeDirectoryAction,
    renameDirectoryAction,
} from '../lib/FileSystem';
import { RequestCustom } from '../interfaces/Request';

export class BucketController {
    private static BucketRepository: Repository<Bucket>;

    constructor() {
        BucketController.BucketRepository = getRepository(Bucket);
    }

    // Get ALL bucket by user
    static all = async (
        request: Request,
        response: Response,
    ): Promise<Response> => {
        const userRepository: Repository<Bucket> = getRepository(Bucket);
        return await userRepository
            .find({
                where: {
                    user: request.user,
                    parentId: request.params.id,
                },
                relations: ['blobs'],
            })
            .then(result => response.json(result).status(200))
            .catch(error => response.status(500).json(error));
    };
    // Get one bucket by user
    static one = async (
        request: Request,
        response: Response,
    ): Promise<Response> => {
        const bucketRepository: Repository<Bucket> = getRepository(Bucket);
        return await bucketRepository
            .find({
                where: {
                    parentId: request.params.id,
                    user: request.user,
                },
                relations: ['blobs'],
            })
            .then(async result => {
                return await bucketRepository
                    .find({
                        where: {
                            id: request.params.id,
                        },
                        relations: ['blobs'],
                    })
                    .then(root => {
                        return response.json(root.concat(result)).status(200);
                    });
            })
            .catch(error => response.status(500).json(error));
    };
    // Get Post bucket
    static post = async (
        request: Request,
        response: Response,
    ): Promise<Response> => {
        const bucketRepository: Repository<Bucket> = getRepository(Bucket);
        const { name, parentId } = request.body;
        const bucket = new Bucket();
        bucket.name = name;
        bucket.parentId = parentId;
        bucket.user = (request as RequestCustom).user;
        await bucketRepository
            .find({ where: { id: parentId } })
            .then(async i => {
                i.map(item => {
                    if (item.name === bucket.user.uuid) {
                        bucket.path = name;
                    } else {
                        bucket.path = `${item.path}/${name}`;
                    }
                });
            });
        createDirectoryAction(
            `${(request as RequestCustom).user.uuid}/${bucket.path}`,
        );
        return await bucketRepository
            .save(bucket)
            .then(() => {
                const token = jwt.sign(
                    {
                        name,
                        user: bucket.user,
                    },
                    config.jwtSecret,
                );
                return response.status(200).json({ bucket, meta: { token } });
            })
            .catch(err => {
                return response.status(500).json({ err });
            });
    };

    // Update Bucket by id
    static update = async (
        request: Request,
        response: Response,
    ): Promise<Response | void> => {
        const bucketRepository: Repository<Bucket> = getRepository(Bucket);
        const { name } = request.body;
        return await bucketRepository
            .findOneOrFail(request.params.id)
            .then(async (bucket: Bucket) => {
                return await renameDirectoryAction(
                    bucket.user.uuid,
                    bucket.name,
                    name,
                ).then(async () => {
                    return await bucketRepository
                        .createQueryBuilder()
                        .update()
                        .set({ name })
                        .where({ id: request.params.id })
                        // .returning(['name', 'id'])
                        .execute()
                        .then(() => {
                            return response.status(200).json({ name });
                        })
                        .catch((error: Error) => {
                            return response.status(500).json({ error });
                        });
                });
            })
            .catch(() => {
                response.status(500).json('directory not created ');
            });
    };

    static delete = async (
        request: Request,
        response: Response,
    ): Promise<Response> => {
        const bucketRepository: Repository<Bucket> = getRepository(Bucket);
        return await bucketRepository
            .findOneOrFail(request.params.id)
            .then(async bucket => {
                return await bucketRepository
                    .find({
                        where: {
                            parentId: bucket.id,
                        },
                    })
                    .then(async i => {
                        return await bucketRepository
                            .remove(i)
                            .then(async () => {
                                return await bucketRepository
                                    .remove(bucket)
                                    .then(() => {
                                        removeDirectoryAction(
                                            `${bucket.user.uuid}/${bucket.name}`,
                                        );
                                        return response
                                            .status(200)
                                            .json(bucket);
                                    })
                                    .catch(error => {
                                        return response.status(500).json(error);
                                    });
                            });
                    });
            })
            .catch(error => {
                return response.status(500).json(error);
            });
    };

    static head = async (
        request: Request,
        response: Response,
    ): Promise<Response> => {
        const { id } = request.params;
        const bucketRepository: Repository<Bucket> = getRepository(Bucket);
        return bucketRepository
            .findOneOrFail(id)
            .then(() => {
                return response.sendStatus(200);
            })
            .catch(() => {
                return response.sendStatus(400);
            });
    };
}
