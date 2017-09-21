import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Subject} from 'rxjs';

@Injectable()
export class DocumentInfoService {
  public filterChangeSubject: Subject<any> = new Subject();
  public documents: any[];
  public filterResults: any[];
  public documentDetail: any;
  public filterSaveSubject: Subject<any> = new Subject();
  public lastFilter = [];
  public filterId;

  constructor(private http: Http) {
  }

  public fetchDocumentPreviewsFromFilterId(filterId) {
    //TODO: when filtering fetch filter ID and name here and store it to some class variables
    this.filterId = filterId;
    this.http.get(`${window['lumeer'].constants.publicPath}/data/documentpreview.json`)
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }

  public fetchDocumentPreviewsFromFilter(filter) {
    //TODO: when filtering fetch filter ID and name here and store it to some class variables
    this.lastFilter = filter;
    this.http.get(`${window['lumeer'].constants.publicPath}/data/documentpreview.json`)
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
    this.filterChangeSubject.next(filter);
  }
}
