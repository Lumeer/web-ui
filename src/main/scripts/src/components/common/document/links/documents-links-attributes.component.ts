import {Component, Input} from '@angular/core';

@Component({
  selector: 'documents-links-attributes',
  template: require('./documents-links-attributes.component.html'),
  styles: [require('./documents-links-attributes.component.scss').toString()]
})

// this component does the same job as documents-rows.component,
//  but we divided it because we think it can be useful in future

export class DocumentsLinksAttributesComponent {

  @Input() public documents: any;
  @Input() public columns: any;

}
