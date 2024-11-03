# debezium-cqrs
Debezium を使った CQRS+ES

## Project setup

```bash
$ docker compose up -d
$ ./Taskfile register-mysql-connector
$ docker compose stop
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
$ docker compose up -d --profile test
$ DATABASE_HOST=localhost DATABASE_PORT=13306 npm run test
```
