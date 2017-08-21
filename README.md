# Lumeer Web UI
This repository holds all data required for UI part of lumeer

## Prerequisites
This repository is using node as run tool, if you want to run it, you have to install it, there are numerous ways of installing it, please refer to [node.js](https://nodejs.org/en/) on how to install it for your system

## Installation
Change directory
```
$ cd /src/main/scripts
```

Before running any run script install dependencies
```
$ npm install
```

To build application locally run
```
$ npm run-script build
```

To run and watch for changes run (server will listen on [http://localhost:7000/](http://localhost:7000/)) it will also set `lumeer-env` variable to `development` so you don't have to set keycloak.
```
$ npm start
```


## Development

If you want to run the application locally on your machine during the development, you have to run (lumeer engine server)[https://github.com/Lumeer/engine] and you have to set environment variable `LUMEER_ENGINE` to point web-ui where the engine is running (default value is `lumeer-engine`). 

## Environment variables

* LUMEER_ENV
    * if you want to disable keycloak for web-ui set it to `development`. Example `$ LUMEER_ENV=development`
* LUMEER_ENGINE
    * to point web-ui where lumeer engine is running, no slashes at start or end. Example: `$ LUMEER_ENGINE=lumeer-engine` if server is running on `localhost:8080/lumeer-engine`
