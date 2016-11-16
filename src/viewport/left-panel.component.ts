import {Component, Input, EventEmitter, Output} from '@angular/core';
import * as _ from 'lodash';
import {Router} from '@angular/router';

@Component({
  selector: 'left-panel',
  template: require('./left-panel.component.html'),
  styles: [ require('./left-panel.component.scss').toString() ]
})
export class LeftPanelComponent {
  @Input() public collapsedValue: boolean;
  @Output() public clickEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(public router: Router) {}

  public onItemClick(child: any, parent: any) {
    _.forEach(this.router.config, item => {
      let activeChild: any = _.find(item.children, {active: true});
      if (activeChild) {
        activeChild.data.active = false;
      }
    });
    child.data.active = true;
    this.clickEvent.emit({parent: parent.data, child: child.data});
  }

  public onHomeClick(): void {
    this.clickEvent.next();
  }
}
