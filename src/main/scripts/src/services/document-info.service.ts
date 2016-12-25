import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
@Injectable()
export class DocumentInfoService {
  public documents: any[];
  constructor(private http: Http) {}

  public fetchDocumentPreviewsFromFilterId(filterId) {
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }

  public fetchDocumentPreviewsFromFilter(filter) {
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }
}
