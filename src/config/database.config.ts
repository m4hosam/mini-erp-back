import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nerd_back_db',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development', // Set to false in production
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Neon usually requires SSL
  }),
);
