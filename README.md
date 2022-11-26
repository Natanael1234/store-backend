## Description

Store backend api made with NestJS.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
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

## Docker-Compose

```bash

# cria e inicia um serviço
docker-compose up

# faz o build das imagens antes de iniciar os containers
docker-compose up --build

# inicia os serviços
docker-compose start

# para os serviços
docker-compose stop

# executa um comando no container. Por exemplo, listar arquivos no container do aplicativo.
docker-compose exec app ls

# usar o shell dentro do container da aplicação.
docker-compose exec app bash

```

## Migrations

```bash
# gerando uma migração
npm run typeorm -- -d ./typeOrm.config.ts migration:generate ./migrations/NomeDaMigracao

# criando uma migração (template para migrações)
npm run typeorm -- migration:create ./migrations/NomeDaMigracao

# observação: as migrações que serão rodadas ou desfeitas são as que estão definidas no campo migrations do DataSource no arquivo typeOrm.config.ts.

# rodando uma migração
npm run typeorm -- -d ./typeOrm.config.ts migration:run

# desfazendo uma migração
npm run typeorm -- -d ./typeOrm.config.ts migration:revert

```
