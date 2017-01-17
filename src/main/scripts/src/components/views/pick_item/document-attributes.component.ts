import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-attributes',
  template: require('./document-attributes.component.html'),
  styles: [require('./document-attributes.component.scss').toString()]
})
export class DocumentAttributesComponent {

  @Input() public attributes: any;

}
