# Contributing Guide

If you want to contribute to Lumeer, read this document in order to save both your time and the time of the developers who maintain this project.

## Technologies
The project is using [Angular 4](https://angular.io/) framework with
[Typescript](https://www.typescriptlang.org/) as the main language.
Some knowledge of [Sass](http://sass-lang.com/) preprocessor and
[RxJS](http://reactivex.io/) is also highly recommended.

## Repository
Before you start working on this project, you will need to set up your Git repository properly. To do so, follow these steps:

1. If you are not familiar with Git, read at least first 3 chapters of [this book](https://git-scm.com/book/en/v2). 
2. Set up your Git by following [these instructions](https://help.github.com/articles/set-up-git/).
3. Fork Lumeer engine repository by following [this guide](https://help.github.com/articles/fork-a-repo/).

## Code style
Before committing check if your code is compliant with our [TSLint](https://palantir.github.io/tslint/) and [EditorConfig](http://editorconfig.org/) rules.
Configuration files for both can be found inside `src/main/scripts`.
If you are using recommended IDE from JetBrains, rules are configured and 
checked automatically.

## License
Add the following license header at the beginning of every TypeScript file you add to Lumeer engine repository:

```
/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
```

## Pull requests
Look at [How To Contribute](https://github.com/Lumeer/engine/wiki/How-To-Contribute#pull-requests) wiki page describing the workflow of creating a pull request to our repositories.

## Angular
Here are some Angular-specific recommendations when working on this project.

### Localization

The application is meant to be accessible in various languages.
Bear this in mind when adding or modifying any visual elements shown to users.

#### i18n Attribute

If you add a new visual element containing a text shown to a user (including text in attributes such as `title`), make sure you add `i18n` in order to enable translation of this text to other languages.

The examples of using `i18n` attribute:

```angular2html
<button i18n="@@collection.delete.dialog.button.no">No</button>
```

```angular2html
<a title="Settings" i18n-title="@@menu.settings">...</a>
```

Put unique identifier of this text as the value of `i18n` attribute prefixed by `@@`.
It needs to be unique across the whole application.
Read [Angular Internationalization Guide](https://angular.io/guide/i18n#mark-text-with-the-i18n-attribute) for more details.

#### ICU Message Format

If you need to translate nouns after numbers (which can have multiple forms in different languages) or different text based on some property, use [ICU Message Format](https://angular.io/guide/i18n#handle-singular-and-plural).

In its current version (4.4.4), Angular does not support ICU message format in attributes.
Use [this workaround](http://chrisgriffing.com/coding/angular/2017/07/22/angular-i18n-icu-messages-attributes/) to make it work.
You can find [some examples](https://github.com/Lumeer/web-ui/blob/24d7fcf79b047ce306adcab84e5811d2f992eee4/src/main/scripts/src/app/core/top-panel/top-panel.component.html#L23-L32) already using this technique in this project. 

#### Translation

If you add or modify elements with `i18n`, make sure you run the following command before creating a commit:

```
npm run i18n
```

It will generate a new version of `messages.xlf` file in `src/i18n` folder.
Look at the changes (git diff) and apply them to other languages (such as `messages.cs.xlf`).

Preferably, you should also provide a translation to these languages by adding `<target>` element to each new translation unit.
If you do not speak those languages, ask maintainers for a translation when you send a pull-request.

### Attribute Binding

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

### Router Link
Prefer using `routerLink` in Angular input binding way, as it checks for 
module dependencies:
```angular2html
[routerLink]="['start', 'child']"
```
instead of
```angular2html
routerLink="/start/child"
```

### CSS sizes

Use exact values (`16px`, `18px`, `30px`) for sizes, instead of 
`medium`, `large`, `x-large` to keep the look consistent no matter the 
user's browser font size.

### SCSS Variables
Prefer using SCSS variables, as it keeps the style consistent, readable, 
and easy to change:
```scss
color: $brand-success;
```
instead of
```scss
color: white;
```

### Recommended reading

 * [Angular Style Guide](https://angular.io/guide/styleguide)  
 * [Typescript Do's and Dont's](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
 * [Angular tutorial](https://angular.io/tutorial)  
 * [Typescript features](https://angular-2-training-book.rangle.io/handout/features/)  
 * [Sass guide](http://sass-lang.com/guide)
