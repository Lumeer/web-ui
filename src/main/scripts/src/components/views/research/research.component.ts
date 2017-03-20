import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {DocumentInfoService} from '../../../services/document-info.service';
import {QueryTagService} from '../../../services/query-tags.service';
import {DocumentNavigationService} from '../../../services/document-navigation.service';

@Component({
  selector: 'views-research',
  template: require('./research.component.html'),
  styles: [require('./research.component.scss').toString()]
})

export class ResearchComponent {
  public activeQuery: any;
  public documents: any;
  public activeRoutes: any[];

  constructor(private route: ActivatedRoute,
              private documentNavigationService: DocumentNavigationService,
              public documentInfoService: DocumentInfoService,
              public queryService: QueryTagService) {
  }

  public ngOnInit() {
    this.activeRoutes = this.documentNavigationService.activeRoutes();
    this.route.queryParams.subscribe(
      keys => {
        this.activeQuery = keys['id'];
        this.documentInfoService.fetchDocumentPreviewsFromFilterId(this.activeQuery);
      }
    );
  }

  public onFilterChanged(dataPayload) {
    this.documentInfoService.fetchDocumentPreviewsFromFilter(dataPayload);
  }

  public collectionAdd(dataPayload) {
    console.log(dataPayload);
  }

  public documentAdd(dataPayload) {
    this.documentInfoService.documents.push(dataPayload);
  }

  public showCollection(dataPayload) {
    this.queryService.addNewCollectionToFilter(dataPayload);
  }

  public isFiltered(): boolean {
    return this.documentInfoService.lastFilter && this.documentInfoService.lastFilter.length !== 0;
  }

  public onNavigationClick(route) {
    let parent = this.documentNavigationService.getParentForChildRoute(route);
    this.documentNavigationService.handleItemSelect({parent: parent.data, child: route.data});
  }
}
