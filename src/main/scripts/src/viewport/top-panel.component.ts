import {Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {OrganizationProject} from '../services/organization-project.service';

@Component({
  host: {
    '(document:click)': 'onClick($event)',
  },
  selector: 'top-panel',
  template: require('./top-panel.component.html'),
  styles: [ require('./top-panel.component.scss').toString() ],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(200, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class TopPanelComponent {
  @Output() public companyToggle = new EventEmitter();
  @Output() public logoutEvent = new EventEmitter();
  @Output() public navigateEvent = new EventEmitter();
  @Input() public activeCorp: any;
  @Input() public activeProject: any;

  constructor(private elementRef: ElementRef, public organizationProject: OrganizationProject) {}

  public ngOnInit() {
    // this.organizationProject.fetchActiveCompany();
    // this.organizationProject.fetchActiveProject();
  }

  public optionsVisible: boolean = false;
  public notificationsVisible: boolean = false;

  public showCompanyChooser() {
    this.companyToggle.next();
  }

  public onLogout() {
    this.logoutEvent.next();
  }

  public onHomeClick() {
    this.navigateEvent.next();
  }

  public toggleOptions() {
    this.optionsVisible = !this.optionsVisible;
    this.notificationsVisible = false;
  }

  public toggleNotifications() {
    this.notificationsVisible = !this.notificationsVisible;
    this.optionsVisible = false;
  }

  public onClick(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropDowns();
    }
  }

  private closeDropDowns() {
    this.notificationsVisible = false;
    this.optionsVisible = false;
  }
}
