import { Component } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';
import {DocumentInfoService} from '../../../services/document-info.service';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  public activeQuery: any;
  public documents: any;
  constructor(private route: ActivatedRoute, public documentInfoService: DocumentInfoService) {}

  public ngOnInit() {
    this.route.queryParams.subscribe(
      keys => {
        this.activeQuery = keys['id'];
        this.documentInfoService.fetchDocumentPreviewsFromFilterId(this.activeQuery);
      }
    );
  }
}
