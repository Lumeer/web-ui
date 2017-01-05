import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-post-it',
  template: require('./document-post-it.component.html'),
  styles: [require('./document-post-it.component.scss').toString()]
})
export class DocumentPostItComponent {

  @Input() public document: any;

  constructor(){}

}
