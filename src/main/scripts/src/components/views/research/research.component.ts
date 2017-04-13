import {Component} from '@angular/core';
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

  constructor(private documentInfoService: DocumentInfoService,
              public queryService: QueryTagService) {
  }

  public ngOnInit() {
    // this.documentInfoService.filterChangeSubject.subscribe((payload) => this.onFilterChanged(payload));
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
}
