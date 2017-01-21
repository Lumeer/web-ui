import {Component, Input} from '@angular/core';

@Component({
  selector: 'documents-rows',
  template: require('./documents-rows.component.html'),
  styles: [require('./documents-rows.component.scss').toString()]
})
export class DocumentsRowsComponent {

  @Input() public documents: any;
  @Input() public columns: any;

}
