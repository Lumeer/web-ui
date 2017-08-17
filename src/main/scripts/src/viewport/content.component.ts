import {Component, Input} from '@angular/core';
import {BreadcrumbService} from '../services/breadcrumb.service';

@Component({
  selector: 'main-content',
  template: require('./content.component.html'),
  styles: [ require('./content.component.scss').toString() ]
})
export class ContentComponent {
  @Input() public currentView: any;
  @Input() public activeLink: any;
  constructor(private breadCrumbService: BreadcrumbService) {}
}
