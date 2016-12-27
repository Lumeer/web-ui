import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {LocalStorage} from 'ng2-webstorage';
@Injectable()
export class DocumentInfoService {
  public documents: any[];
  @LocalStorage() public lastFilter;

  constructor(private http: Http) {}

  public fetchDocumentPreviewsFromFilterId(filterId) {
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }

  public fetchDocumentPreviewsFromFilter(filter) {
    this.lastFilter = filter;
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }
}
