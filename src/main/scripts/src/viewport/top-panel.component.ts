import {Component, EventEmitter, Output, Input} from '@angular/core';
import {BreadcrumbService} from '../services/breadcrumb.service';
@Component({
  selector: 'top-panel',
  template: require('./top-panel.component.html'),
  styles: [ require('./top-panel.component.scss').toString() ]
})
export class TopPanelComponent {
  @Output() public collapseEvent = new EventEmitter();
  @Output() public logoutEvent = new EventEmitter();
  @Output() public navigateEvent = new EventEmitter();
  @Input() public currentView: any;
  @Input() public activeLink: any;
  constructor(private breadCrumbService: BreadcrumbService) {}

  public newFilterName = '';
  public showSave: boolean = false;

  public onCollapse() {
    this.collapseEvent.next();
  }

  public onLogout() {
    this.logoutEvent.next();
  }

  public onHomeClick() {
    this.navigateEvent.next();
  }
}
