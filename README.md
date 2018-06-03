# Lumeer Web UI
This repository contains Lumeer front-end source code.

## Prerequisites
The following tools are needed to work with this repository:
* [Node.js](https://nodejs.org/en/) 8.x (LTS)
* [NPM](https://www.npmjs.com/) 6.x (latest)

Read how to install and set up both these tools [here](https://docs.npmjs.com/getting-started/installing-node#install-npm--manage-npm-versions).

## Dependencies

Before running the application on your machine for the first time, install project dependencies:
```bash
$ npm install
```

## Development

You can run the application locally using the following NPM scripts:

1. `npm run start`: uses JIT compiler and default language (English at the moment)
2. `npm run start:cs`: uses AOT compiler and Czech language
3. `npm run start:en`: uses AOT compiler and English language

The application will run on [http://localhost:7000/ui](http://localhost:7000/ui) by default.

You also need to run our [back-end](https://github.com/Lumeer/engine) if you want to be able to work with the application.

## Deployment

Here is the example command to build the application WAR file with all configuration properties you might need:
```bash
$ LUMEER_ENV=production \
> I18N_LOCALE=en \
> SENTRY_DSN=https://<key>@sentry.io/<project> \
> BUILD_NUMBER=42 \
> LUMEER_ENGINE=lumeer-engine \
> mvn clean package -Dcontext.root=en
```

 * `LUMEER_ENV`: environment in which the application runs (`staging`, `production` or empty)
 * `I18N_LOCALE`: language to be used in the application (`en`, `cs` or empty to use default `en`)
 * `SENTRY_DSN`: Sentry Data Source Name, if set it activates Sentry (recommended for production only)
 * `BUILD_NUMBER`: build number to be shown in the application
 * `LUMEER_ENGINE`: back-end deployment context root
 * `context.root`: front-end deployment context root

## Translations
When you add some text to the application which will be shown to the user, you should always add `i18n` attribute on its element with the translation string unique ID as its value. For example:

```html
<span i18n="@@view.override.button.cancel">Cancel</span>
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

