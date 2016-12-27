import { Component } from '@angular/core';
import {LocalStorage} from 'ng2-webstorage';

@Component({
  selector: 'views-single-document',
  template: require('./single-document.component.html')
})

export class SingleDocumentComponent {
  @LocalStorage('lastDocument') public activeDocument;

  constructor() {
    console.log(this);
  }
}
