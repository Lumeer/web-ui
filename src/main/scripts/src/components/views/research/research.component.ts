import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';
import {DocumentInfoService} from '../../../services/document-info.service';

@Component({
  selector: 'views-research',
  template: require('./research.component.html'),
  styles: [require('./research.component.scss').toString()]
})

export class ResearchComponent {
  public activeQuery: any;
  public documents: any;

  constructor(private route: ActivatedRoute, public documentInfoService: DocumentInfoService) {
  }

  public ngOnInit() {
    this.route.queryParams.subscribe(
      keys => {
        this.activeQuery = keys['id'];
        this.documentInfoService.fetchDocumentPreviewsFromFilterId(this.activeQuery);
      }
    );
  }

  public onFilterChanged(dataPayload){
    this.documentInfoService.fetchDocumentPreviewsFromFilter(dataPayload);
  }
}
