<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Nerd Back API

Backend API for Nerd application built with NestJS.

## Prerequisites

- Node.js (v20 or later recommended)
- PostgreSQL Database

## Installation

```bash
$ npm install
```

## Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   _On Windows (PowerShell):_

   ```powershell
   copy .env.example .env
   ```

2. Update `.env` with your database credentials and other configuration.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Database Migrations

This project uses TypeORM for database interactions.

### Generate a migration

When you modify an entity, generate a migration to update the database schema:

```bash
$ npm run migration:generate -- src/migrations/MigrationName
```

Example: `npm run migration:generate -- src/migrations/CreateUsersTable`

### Run migrations

Apply pending migrations to the database:

```bash
$ npm run migration:run
```

### Revert migration

Revert the last applied migration:

```bash
$ npm run migration:revert
```

### Create an empty migration

If you need to write SQL manually:

```bash
$ npm run migration:create -- src/migrations/MigrationName
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
