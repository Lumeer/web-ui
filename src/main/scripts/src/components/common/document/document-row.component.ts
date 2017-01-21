import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-row',
  template: require('./document-row.component.html'),
  styles: [require('./document-row.component.scss').toString()]
})
export class DocumentRowComponent {

  @Input() public document: any;

}
