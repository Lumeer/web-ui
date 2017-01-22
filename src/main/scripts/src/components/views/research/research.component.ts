import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';
import {DocumentInfoService} from '../../../services/document-info.service';
import {QueryTagService} from '../../../services/query-tags.service';

@Component({
  selector: 'views-research',
  template: require('./research.component.html'),
  styles: [require('./research.component.scss').toString()]
})

export class ResearchComponent {
  public activeQuery: any;
  public documents: any;

  constructor(private route: ActivatedRoute,
              public documentInfoService: DocumentInfoService,
              public queryService: QueryTagService) {
  }

  public ngOnInit() {
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
    console.log(dataPayload);
  }

  public showCollection(dataPayload) {
    this.queryService.addNewCollectionToFilter(dataPayload);
  }

  public isFiltered(): boolean {
    return this.documentInfoService.lastFilter && this.documentInfoService.lastFilter.length !== 0;
  }
}
