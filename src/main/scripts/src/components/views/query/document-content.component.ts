import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-content',
  template: require('./document-content.component.html'),
  styles: [require('./document-content.component.scss').toString()]
})
export class DocumentContentComponent{

  @Input() public documentValues;

  constructor(){}

}

