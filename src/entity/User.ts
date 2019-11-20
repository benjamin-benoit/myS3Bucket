import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IsDate, IsEmail, Length } from 'class-validator';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    uuid?: string;

    @Column('text', { nullable: true })
    @Length(4, 20)
    nickname?: string;

    @Column('text', { nullable: true, unique: true })
    @IsEmail()
    email?: string;

    @Column('text')
    @Length(4, 100)
    password?: string;

    @CreateDateColumn({ type: 'timestamp' })
    @IsDate()
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    @IsDate()
    updatedAt?: Date;
}
