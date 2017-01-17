import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-history',
  template: require('./document-history.component.html'),
  styles: [require('./document-history.component.scss').toString()]
})
export class DocumentHistoryComponent {

  @Input() public history: any;

}
