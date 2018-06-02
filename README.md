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

Please note that you do not need to run `npm build` if you want run the application locally (even if the dependencies have been changed). Angular CLI which is used under the hood is able to handle it without running the build command before.

When you run the application locally, it is not possible to configure it using environment variables. But you can choose from three configurations when you run it:

1. `npm start`: uses JIT compiler and default language (English at the moment)
2. `npm start:cs`: uses AOT compiler and Czech language
3. `npm start:en`: uses AOT compiler and English language

TSLint will be run with every pull-request so make sure you write nice code!

## Deployment

Here is the example command to build the application with all configuration properties you might need:
```LUMEER_ENV=production \
I18N_LOCALE=en \
SENTRY_DSN=https://<key>@sentry.io/<project> \
BUILD_NUMBER=42 \
LUMEER_ENGINE=lumeer-engine \
mvn clean package -Dcontext.root=en```

• *LUMEER_ENV*: environment in which the application runs (`staging`, `production` or empty)
• *I18N_LOCALE*: language to be used in the application (`en`, `cs` or empty to use default `en`)
• *SENTRY_DSN*: Sentry Data Source Name, if set it activates Sentry (recommended for production only)
• *BUILD_NUMBER*: build number to be shown in the application
• *LUMEER_ENGINE*: back-end deployment context root
• *context.root*: front-end deployment context root

If you want to run the application locally on your machine during the development, you have to run [lumeer engine server](https://github.com/Lumeer/engine) and you have to set environment variable `LUMEER_ENGINE` to point web-ui where the engine is running (default value is `lumeer-engine`). 

## Environment variables

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
