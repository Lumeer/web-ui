# Lumeer Web UI

This repository contains Lumeer front-end source code.

## Prerequisites

The following tools are needed to work with this repository:

- [Node.js](https://nodejs.org/en/) 10 (LTS)
- [NPM](https://www.npmjs.com/) 6 (latest)

Read how to install and set up both these tools [here](https://docs.npmjs.com/getting-started/installing-node#install-npm--manage-npm-versions).

## Dependencies

Before running the application on your machine for the first time, install project dependencies:

```bash
$ npm install
```

## Development

You can run the application locally using the following NPM scripts:

1. `npm run start`: uses JIT compiler and default language (English at the moment)
1. `npm run start:aot`: uses AOT compiler and default language (English at the moment)
1. `npm run start:cs`: uses AOT compiler and Czech language
1. `npm run start:en`: uses AOT compiler and English language

The application will be run on [http://localhost:7000/ui](http://localhost:7000/ui) by default.
The third script runs the application on [http://localhost:7000/cs](http://localhost:7000/cs) and the fourth one runs it on [http://localhost:7000/en](http://localhost:7000/en).

You also need to run our [back-end](https://github.com/Lumeer/engine) if you want to be able to work with the application.

### Memory limits

If the build process takes too long or fails because it runs out of memory, set `NODE_OPTIONS` environment property with the maximum amount of memory your machine can provide for this process (7000 MB is used in the following example):

```bash
NODE_OPTIONS=--max_old_space_size=7000 npm run start
```

It is recommended to save the commands above together with this environment property as run tasks in your IDE so you do not have to type long commands every time you start the application.

## Deployment

Here is the example command to build the application WAR file with all configuration properties you might need:

```bash
$ AUTH_CLIENT_ID=<auth0 client id> \
> AUTH_DOMAIN=<auth0 app domain> \
> BLOCKLY_CDN=<javascript library url> \
> BUILD_NUMBER=42 \
> I18N_LOCALE=en \
> LOGZIO_KEY=<access token> \
> LUMEER_ENGINE=lumeer-engine \
> LUMEER_ENV=production \
> MAPBOX_KEY=<access token> \
> MAPQUEST_KEY=<consumer key> \
> MAPTILER_KEY=<key> \
> MAX_FILE_UPLOAD_SIZE=10 \
> PUSHER_CLUSTER=us1 \
> PUSHER_KEY=<pusher api key> \
> PRESIGNED_URL_TIMEOUT=60 \
> SENTRY_DSN=https://<key>@sentry.io/<project> \
> SENTRY_AUTH_TOKEN=<secret token> \
> SESSION_TIMEOUT=30 \
> SMARTLOOK_KEY=<api key> \
> mvn clean package -Dcontext.root=en
```

- `AUTH_CLIENT_ID`: client ID of Auth0 application
- `AUTH_DOMAIN`: base URL for Auth0 authentication
- `BLOCKLY_CDN`: Blockly JavaScript library URL (optional)
- `BUILD_NUMBER`: build number to be shown in the application
- `I18N_LOCALE`: language to be used in the application (`en`, `cs` or empty to use default `en`)
- `LOGZIO_KEY`: Logz.io access token
- `LUMEER_ENGINE`: back-end deployment context root
- `LUMEER_ENV`: environment in which the application runs (`staging`, `production` or empty)
- `MAPBOX_KEY`: Mapbox access token
- `MAPQUEST_KEY`: MapQuest consumer key
- `MAPTILER_KEY`: MapTiler key
- `MAX_FILE_UPLOAD_SIZE`: maximum allowed size of file attachment in megabytes (10 MB by default)
- `PRESIGNED_URL_TIMEOUT`: time period in seconds during which a presigned file URL is valid (60s by default)
- `PUSHER_CLUSTER`: Pusher.com for push notifications - the server cluster to be used
- `PUSHER_KEY`: Pusher.com for push notifications - the secret API key
- `SENTRY_DSN`: Sentry Data Source Name, if set it activates Sentry (recommended for production only)
- `SENTRY_AUTH_TOKEN`: Sentry authentication token
- `SESSION_TIMEOUT`: user inactivity time before session expiration (in minutes)
- `SMARTLOOK_KEY`: Smartlook API key
- `context.root`: front-end deployment context root (`/ui/` by default)

If you are adding a new environment variable, make sure it is used in both `env-vars.js` and `src/environments/configuration-variables.ts` files.
Otherwise, it will not get propagated to the application.

## Translations

When you add some text to the application which will be shown to the user, you should always add `i18n` attribute on its element with the translation string unique ID as its value. For example:

```html
<span i18n="@@button.cancel">Cancel</span>
```

See the details in the [Angular documentation](https://angular.io/guide/i18n).

After you add new texts, you need to run the following command:

```bash
$ npm run i18n
```

It will add your new texts into all translation files (`src/i18n/messages.en.xlf` and `src/i18n/messages.cs.xlf`). You then need to open these files and translate the texts by adding the translations between the `<target>...</target>` tags.

## How To Contribute

Everyone is welcome to contribute to this project.
However, before you start making any changes, read the [Contributing Guide](https://github.com/Lumeer/web-ui/blob/devel/CONTRIBUTING.md) first.

TSLint is run with every pull-request so make sure your code complies with our linting rules by running the following script:

```bash
$ npm run lint
```
