import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeycloakService} from '../services/keycloak.service';
import {DocumentInfoService} from '../services/document-info.service';
import {DocumentNavigationService} from '../services/document-navigation.service';

@Component({
  selector: 'view-port',
  template: require('./viewport.component.html'),
  styles: [ require('./viewport.component.scss').toString() ]
})

export class ViewPortComponent {
  public companyVisible: boolean = true;
  public activeItem: any;
  public activeFilter: any;

  constructor(private router: Router, private kc: KeycloakService,
              private documentInfoService: DocumentInfoService,
              private documentNavigationService: DocumentNavigationService) {}

  public handleToggleCompany() {
    this.companyVisible = !this.companyVisible;
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
    this.documentNavigationService.handleItemSelect();
    this.activeItem = { title: 'Home'};
    this.documentInfoService.filterSaveSubject.subscribe(newFilter => this.onFilterSave(newFilter));
  }

  public onSaveCompanyProject() {
    this.companyVisible = false;
  }
}
