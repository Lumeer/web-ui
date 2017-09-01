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

**General Lumeer contribution rules can be found in the 
[Engine wiki](https://github.com/Lumeer/engine/wiki/How-To-Contribute).**

Before committing check if your code is compliant with our 
[TSLint](https://palantir.github.io/tslint/) and 
[EditorConfig](http://editorconfig.org/) rules.
Configuration files for both can be found inside `src/main/scripts`.
(If you are using recommended IDE from JetBrains, rules are configured and 
checked automatically.)

The project is using [Angular 4](https://angular.io/) framework with
[Typescript](https://www.typescriptlang.org/) as the main language.
Some knowledge of [Sass](http://sass-lang.com/) preprocessor and
[RxJS](http://reactivex.io/) is also highly recommended.

If you create a new implementation of an existing feature, remove the old files from
the project to prevent clutter.

### Recommended reading

 * [Angular Style Guide](https://angular.io/guide/styleguide)  
 * [Typescript Do's and Dont's](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
 * [Angular tutorial](https://angular.io/tutorial)  
 * [Typescript features](https://angular-2-training-book.rangle.io/handout/features/)  
 * [Sass guide](http://sass-lang.com/guide)  

### Angular Guide
Put all component CSS under `:host` selector, to prevent styles being applied
globally.

Use exact values (`16px`, `18px`, `30px`) for sizes, instead of 
`medium`, `large`, `x-large` to keep the look consistent no matter the 
user's browser font size.

#### Attribute Binding

Prefer using attributes allowing {{ }} binding, as it is easier to read and 
allows writing strings in template style:
```angular2html
[style.width]="{{ width }}px"
class="{{ myClass }}"
```
instead of
```angular2html
[ngStyle]="{width: width + 'px'}"
[ngClass]="{myClass: true}"
```

#### Router Link
Prefer using `routerLink` in Angular input binding way, as it checks for 
module dependencies:
```angular2html
[routerLink]="['start', 'child']"
```
instead of
```angular2html
routerLink="/start/child"
```

#### SCSS Variables
Prefer using SCSS variables, as it keeps the style consistent, readable, 
and easy to change:
```scss
color: $brand-success;
```
instead of
```scss
color: white;
```
