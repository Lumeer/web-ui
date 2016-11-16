import {Component, Input, Inject} from '@angular/core';
import {BreadcrumbService} from '../services/breadcrumb.service';

@Component({
  selector: 'main-content',
  template: require('./content.component.html'),
  styles: [ require('./content.component.scss').toString() ]
})
export class ContentComponent {
  @Input() public currentView: any;
  constructor(private breadCrumbService: BreadcrumbService) {
    console.log(this);
  }
}
