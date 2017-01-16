import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-detail',
  template: require('./document-detail.component.html'),
  styles: [require('./document-detail.component.scss').toString()]
})
export class DocumentDetailComponent {

  @Input() public document: any;

}
