# Contributing Guide

If you want to contribute to Lumeer, read this document in order to save both your time and the time of the developers who maintain this project.

## Technologies

The project is written in [Typescript](https://www.typescriptlang.org/) and based on [Angular](https://angular.io/).
You can get familiar with this framework many different ways but we recommend you these steps:

- Read official Angular tutorial [Tour of Heroes](https://angular.io/tutorial)
- Take [Angular Crash Course](https://www.udemy.com/angular-crash-course/) on Udemy

The state management is ensured by Redux-like library [NgRx](https://ngrx.github.io/).
It is crucial to know the principles this library is based on since it is used heavily throughout the whole application.
You can start with the following sources or read more up-to-date articles on [Medium](https://medium.com/search?q=ngrx):

- [Using NgRx 4 to Manage State in Angular Applications](https://blog.nrwl.io/using-ngrx-4-to-manage-state-in-angular-applications-64e7a1f84b7b)
- [Comprehensive Introduction to @ngrx/store](https://gist.github.com/btroncone/a6e4347326749f938510)

Some knowledge of [SASS](http://sass-lang.com/) preprocessor and [RxJS](http://reactivex.io/) is also highly recommended.

## Repository

Before you start working on this project, you will need to set up your Git repository properly. To do so, follow these steps:

1. If you are not familiar with Git, read at least first 3 chapters of [this book](https://git-scm.com/book/en/v2).
2. Set up your Git by following [these instructions](https://help.github.com/articles/set-up-git/).
3. Fork Lumeer engine repository by following [this guide](https://help.github.com/articles/fork-a-repo/).

## Code style

Try to write clean code that is self-explaining and can be easily understood by others.
If you are not good at it, read the following book:

- [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.goodreads.com/book/show/3735293-clean-code)

[Prettier](https://prettier.io/) and [TSLint](https://palantir.github.io/tslint/) are run as a Git pre-commit hook in order to provide uniform code style and check code quality.

Prettier formats the code automatically so you do not need to worry about formatting your code at all.
It is recommended to install Prettier extension for your IDE so the code is formatted every time you save a file.

TSLint checks your code for potential problems and asks you to fix them before committing your changes.

### HTML

HTML code is not formatted by Prettier at the moment as it uses different code style.
Try to put every attribute on a new line to make the code more readable.

If you use [Visual Studio Code](https://code.visualstudio.com/) with Prettier extension and want to use IDE's internal formatter for HTML, you need to add the following line to your workspace settings:

```
"prettier.disableLanguages": ["angular", "html", "vue"],
```

## Component design

Although it might seem like an easy task, designing components in a good way is always something between art and rocket science.

### Size

Try to avoid large components doing 10 different things and having hundreds of lines of source code.
Such components are hard to maintain and error-prone since every change might introduce various side effects and cause many bugs.

Try to design new components as small as possible.
Basically every visual element should be represented by its own component.

For example, when you need to display a list of items together with other things in your component, it should probably be done in a separate component.
Based on how complicated those items are and what actions you need to do with every one of them, it might also be a good practise to use a new component for displaying a single item.

### Reusability

Before you create a new component, you should think about other parts of the application where it could potentially be used.
But do not overcomplicate a simple component just because some hypothetical use case in the future.

Try to design clear component interfaces (`@Input` and `@Output` properties in Angular) but keep the number of interactions with its surroundings to a minimum.

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
$ npm run i18n
```

It will generate a new version of `messages.xlf` file in `src/i18n` folder and merge the changes to the files for other languages (such as `messages.cs.xlf`).

Preferably, you should also provide a translation to these languages by changing `<target>` element content as well as removing its `state="new"` attribute in each newly added translation unit.
If you do not speak those languages, ask maintainers for a translation when you send a pull-request.

### Adding Non-Angular NPM packages

```
$ npm install <package name> --save
```

And if possible download the types too.

```
$ npm install @types/<package name> --save
```

Then add the package to `.angular-cli.json` under `"scripts"` key to include it in Angular CLI compilation:

```
"scripts": [
  "../node_modules/<path to module javascript>"
]
```

Also add the module to `vendor.ts` for webpack compilation:

```
import '../node_modules/<path to module javascript>';
```

If the module provides any classes for use, declare their types in `typings.d.ts`:

```
declare var <class name>: any;
```

Lastly add it to `polyfill.ts` if for browser mapping the module to its name:

```
window['<class name>'] = require('../node_modules/<path to module javascript>');
```

You need to rebuild the project after the change in order for your package to be included:

```
npm run-script build
```

### Adding Perspectives

Create a new perspective in `view/perspectives/<perspective name>` with its own code component and module.
The module needs to provide the perspective component:

```
declarations: [
  <perspective component>
],
entryComponents: [
  <perspective component>
],
exports: [
  <perspective component>
]
```

Add the perspective name and icon in the `perspective.ts` file.
(You can find your icon in icon palette when choosing collection icon, and just copy its name)

In the `view-controls.component.html` add the perspective to the selection of views in two places:

```
<span ...>{perspective, select, <your perspective name> {<displayed name>} graph {Graph} ...}</span>
```

and few lines below in `<ng-container *ngFor="let perspective of perspectives()">`:

```
<span ...>{perspective, select, <your perspective name> {<displayed name>} graph {Graph} ...}</span>
```

Add it to `view-routing.module.ts` to map perspective name to it's component:

```
{
  path: Perspective.<your perspective name>,
  component: <perspecive component>
},
```

If your perspective should not be visible at all times (like when it needs a selected collection).
Update `canShowPerspective` in `view-controls.component.ts` to reflect this constraint. And add a
`isDisplayable()` check in your perspective to make sure, users won't be able to access it using URL.

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

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Typescript Do's and Dont's](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Angular tutorial](https://angular.io/tutorial)
- [Typescript features](https://angular-2-training-book.rangle.io/handout/features/)
- [Sass guide](http://sass-lang.com/guide)
