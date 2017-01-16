import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {LocalStorage} from 'ng2-webstorage';
import {Subject} from 'rxjs';

@Injectable()
export class DocumentInfoService {
  public documents: any[];
  public filterSaveSubject: Subject<any> = new Subject();
  @LocalStorage() public lastFilter;
  @LocalStorage() public filterId;

  constructor(private http: Http) {}

  public fetchDocumentPreviewsFromFilterId(filterId) {
    //TODO: when filtering fetch filter ID and name here and store it to some class variables
    this.filterId = filterId;
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }

  public fetchDocumentPreviewsFromFilter(filter) {
    //TODO: when filtering fetch filter ID and name here and store it to some class variables
    this.lastFilter = filter;
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }
}
