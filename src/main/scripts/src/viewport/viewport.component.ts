import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeycloakService} from '../services/keycloak.service';
import {DocumentService} from '../services/document.service';
import {DocumentInfoService} from '../services/document-info.service';

@Component({
  selector: 'view-port',
  template: require('./viewport.component.html'),
  styles: [ require('./viewport.component.scss').toString() ]
})

export class ViewPortComponent {
  public collapsed: boolean = false;
  public activeItem: any;
  public activeFilter: any;

  constructor(private router: Router, private kc: KeycloakService, private documentInfoService: DocumentInfoService) {}

  public handleCollapseEvent() {
    this.collapsed = !this.collapsed;
  }

  public handleItemSelect(dataPayload) {
    if (dataPayload) {
      if (dataPayload.child.id === 'query' && dataPayload.link) {
        this.activeFilter = dataPayload.link;
      }
      this.activeItem = dataPayload.child;
      let navigateTo: any = [`${dataPayload.parent.id}`, `${dataPayload.child.id}`];
      if (dataPayload.link) {
        this.router.navigate(navigateTo, {queryParams: {id: dataPayload.link.id}});
      } else {
        this.router.navigate(navigateTo);
      }
    } else {
      this.activeItem = { title: 'Home'};
      this.router.navigate([`/`]);
    }
  }

  public handleLogOut() {
    this.kc.logout();
  }

  public handleNavigate() {
    let win = window.open('http://www.lumeer.io/', '_blank');
    win.focus();
  }

  public onFilterSave(dataPayload) {
    console.log(this.router, dataPayload);
  }

  public ngOnInit() {
    this.activeItem = { title: 'Home'};
    this.documentInfoService.filterSaveSubject.subscribe(newFilter => this.onFilterSave(newFilter));
  }
}
