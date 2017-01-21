import {Component, Input} from '@angular/core';

@Component({
  selector: 'links',
  template: require('./links.component.html'),
  styles: [require('./links.component.scss').toString()]
})
export class LinksComponent {

  @Input() public links: any;
  @Input() public type: string;

}
