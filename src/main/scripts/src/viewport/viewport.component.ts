import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeycloakService} from '../services/keycloak.service';

@Component({
  selector: 'view-port',
  template: require('./viewport.component.html'),
  styles: [ require('./viewport.component.scss').toString() ]
})

export class ViewPortComponent {
  public collapsed: boolean = false;
  public activeItem: any;

  constructor(private router: Router, private kc: KeycloakService) {}

  private ngOnInit() { this.activeItem = { title: 'Home'}; }

  public handleCollapseEvent() {
    this.collapsed = !this.collapsed;
  }

  public handleItemSelect(dataPayload) {
    if (dataPayload) {
      this.activeItem = dataPayload.child;
      this.router.navigate([`/${dataPayload.parent.id}`, `${dataPayload.child.id}`]);
    } else {
      this.activeItem = { title: 'Home'};
      this.router.navigate([`/`]);
    }
  }

  public handleLogOut() {
    this.kc.logout();
  }
}
