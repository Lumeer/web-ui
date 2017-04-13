import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DocumentNavigationService} from '../services/document-navigation.service';
import {DocumentInfoService} from '../services/document-info.service';
import * as _ from 'lodash';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'home-content',
  template: require('./home.component.html'),
  styles: [require('./home.component.scss').toString()],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(500, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(500, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class HomeComponent {
  @Input() public companyVisible: any;
  @Output() public saveAction: EventEmitter<any> = new EventEmitter();
  public activeRoutes: any;

  constructor(protected route: ActivatedRoute,
              protected documentNavigationService: DocumentNavigationService,
              public documentInfoService: DocumentInfoService) {}

  public ngOnInit() {
    this.activeRoutes = this.documentNavigationService.activeRoutes();
    this.selectRoute(this.activeRoutes[0]);
  }

  public onSaveAction() {
    this.saveAction.next();
  }

  public onNavigationClick(route) {
    let parent = this.documentNavigationService.getParentForChildRoute(route);
    this.documentNavigationService.handleItemSelect({parent: parent.data, child: route.data});
    this.activeRoutes = this.documentNavigationService.activeRoutes();
    this.selectRoute(route);
  }

  public onFilterChanged(dataPayload) {
    this.documentInfoService.fetchDocumentPreviewsFromFilter(dataPayload);
  }

  private selectRoute(activeRoute?: any) {
    let currentRoute: any = _.find(this.activeRoutes, {component: activeRoute.component});
    if (currentRoute) {
      currentRoute.data.current = true;
    }
  }
}
