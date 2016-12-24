import { Component } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  public activeQuery: any;
  public documents: any;
  constructor(private route: ActivatedRoute, private http: Http) {}

  public ngOnInit() {
    this.route.queryParams.subscribe(
      keys => {
        this.activeQuery = keys['id'];
        this.fetchDocumentPreviews();
      }
    );
  }

  private fetchDocumentPreviews() {
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }
}
