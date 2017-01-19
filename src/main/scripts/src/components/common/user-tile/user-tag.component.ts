import {Component, Input} from '@angular/core';
@Component({
  selector: 'user-tag',
  template: require('./user-tag.component.html'),
  styles: [ require('./user-tag.component.scss').toString() ]
})

export class UserTagComponent {
  @Input() public user: any;
  @Input() public action: any;
  @Input() public time: any;
}
