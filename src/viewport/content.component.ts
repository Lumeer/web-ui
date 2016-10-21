import { Component } from '@angular/core';
@Component({
  selector: 'main-content',
  template: require('./content.component.html'),
  styles: [ require('./content.component.scss').toString() ]
})
export class ContentComponent { }
