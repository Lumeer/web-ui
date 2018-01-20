# Lumeer Web UI
This repository holds all data required for lumeer UI

## Prerequisites
This repository is using Node.js® as run tool, if you want to run it, you have to install it, there are numerous ways of installing it, please refer to [node.js](https://nodejs.org/en/download/) on how to install it for your system

## Installation
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
* BUILD_NUMBER - if this variable is set, the given build number is shown in the top panel dropdown menu
```
$ BUILD_NUMBER=42
```
* AOT - To turn off or on AOT generation. Default is false.
```
$ AOT=true
```
* OUTPUT_PATH - Where should the build app should be placed. Good for different language mutations. Default to `dist/`.
```
$ OUTPUT_PATH=dist/
```
* I18N_FORMAT - File format of i18n file. Default is `xlf`.
```
$ I18N_FORMAT=xlf
```
* I18N_LOCALE - Language to which app should be translated. Default to `en`.
```
$ I18N_LOCALE=en
```
* I18N_PATH - Location to translate file. Default to `src/i18n/messages.I18_NLOCALE.I18N_FORMAT`.
```
$ I18N_PATH=src/messages.xlf
```

#### Translate settings
If you want to translate app into different language, use command `npm run i18n` which will generate `src/i18n/messages.xlf` file.
Copy this file and change name of it based on the language (for example to translate messages to French name it `src/i18n/messages.fr.xlf`).

Add translation to this file (you can add `<target>...</target>` bellow `<source>...</source>` to apply changes, or use some program to it).

Set environment variable to desired language (`I18N_LOCALE=fr`), set AOT variable to true `AOT=true` (sadly only AOT apps can be translated) and run either `npm start` or `npm run build` (if you want to make some code changes or just build the app).

You will find your translated application in `dist/` folder. If you want to translate to multiple languages set `OUTPUT_PATH=dist/I18N_LOCALE` to store app in different folders. 

## How To Contribute

Everyone is welcome to contribute to this project.
However, before you start making any changes, read the [Contributing Guide](https://github.com/Lumeer/web-ui/blob/devel/CONTRIBUTING.md) first.
