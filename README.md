# Lumeer Web UI
This repository holds all data required for lumeer UI

## Prerequisites
This repository is using Node.js® as run tool, if you want to run it, you have to install it, there are numerous ways of installing it, please refer to [node.js](https://nodejs.org/en/download/) on how to install it for your system

## Installation
Change directory
```bash
$ cd /src/main/scripts
```

Before running any run script install dependencies
```bash
$ npm install
```

To build application locally run
```bash
$ npm run-script build
```

To run and watch for changes run (the server will listen on [http://localhost:7000/](http://localhost:7000/)). It also sets `lumeer-env` variable to `development` so there is no need to configure keycloak.
```bash
$ npm start
```


## Development

If you want to run the application locally on your machine during the development, you have to run [lumeer engine server](https://github.com/Lumeer/engine) and you have to set environment variable `LUMEER_ENGINE` to point web-ui where the engine is running (default value is `lumeer-engine`). 

## Environment variables

* `LUMEER_ENV` - if you want to disable keycloak for web-ui set it to `development`.
```
$ LUMEER_ENV=development
```
* LUMEER_ENGINE - Points to the [lumeer engine server](https://github.com/Lumeer/engine), no slashes at start or end. If the server listnens on `localhost:8080/lumeer-engine` set it to:
```
$ LUMEER_ENGINE=lumeer-engine
```

## How To Contribute

Everyone is welcome to contribute to this project.
However, before you start making any changes, read the [Contributing Guide](https://github.com/Lumeer/web-ui/blob/devel/CONTRIBUTING.md) first.
