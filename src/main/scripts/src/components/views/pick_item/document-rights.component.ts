import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-rights',
  template: require('./document-rights.component.html'),
  styles: [require('./document-rights.component.scss').toString()]
})
export class DocumentRightsComponent {

  @Input() public rights: any;

}
