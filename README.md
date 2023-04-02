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

# Obs: to debug tests use the commands above in VSCode's Javascript Debug Terminal. Make sure Auto Attach is disabled. (F1->Toggle Auto Attach)
```

## Docker-Compose

```bash

# cria e inicia um serviço
docker-compose up

# faz o build das imagens antes de iniciar os containers
docker-compose up --build


# --build
#   -V,--renew-anon-volumes: remove volumes anônimos e os cria novamente;
#   -d, --detach: detach mode. Run containers in the background;
#   --build: build images before starting containers. garante que o npm install rode novamente, durante o processo de build.
docker-compose up --build -V -d


docker-compose up -V --build


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

# Debugging

# 1 - With Docker Desktop running type:

docker-compose up --build -V

# 2 - Run "Debug: NestJS-Store" in VS Code debug tab.
