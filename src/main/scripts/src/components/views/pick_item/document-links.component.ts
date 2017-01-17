import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-links',
  template: require('./document-links.component.html'),
  styles: [require('./document-links.component.scss').toString()]
})
export class DocumentLinksComponent {

  @Input() public links: any;

}
