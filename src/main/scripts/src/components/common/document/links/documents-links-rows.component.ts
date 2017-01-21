import {Component, Input} from '@angular/core';

@Component({
  selector: 'documents-links-rows',
  template: require('./documents-links-rows.component.html'),
  styles: [require('./documents-links-rows.component.scss').toString()]
})
export class DocumentLinksRowsComponent {

  @Input() public headerAttrsLink: string[];
  @Input() public documentsLink: any[];
  @Input() public headerAttrsDoc: string[];
  @Input() public documentsDoc: any[];


}
