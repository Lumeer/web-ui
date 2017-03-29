# Lumeer Web UI
This repository holds all data required for UI part of lumeer

### Prerequisites
This repository is using node as run tool, if you want to run it, you have to install it, there are numerous ways of installing it, please refer to [node.js](https://nodejs.org/en/) on how to install it for your system

### Installation
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

To run and watch for changes run (server will listen on [http://localhost:7000/](http://localhost:7000/))
```
$ npm start
```

This application is using typings for typescript references, you have to install it globally if you want to install new typings packages via command line
```
$ npm install -g typings
```
