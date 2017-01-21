import {Injectable} from '@angular/core';
import {LocalStorage} from 'ng2-webstorage/dist/app';
import {Http} from '@angular/http';

@Injectable()
export class DocumentService {
  @LocalStorage('lastDocument') public activeDocument;
  public documentDetail: any;
  public filterResults: any;

  constructor(private http: Http) {}

  public setActiveDocument(document) {
    this.activeDocument = document;
    this.fetchDocumentInfo();
  }

  public fetchDocumentInfo() {
    if (this.activeDocument) {
      this.activeDocument.links.map( link => this.fetchLinkInfo(link));
    }
  }

  public fetchDocumentVersions() {
    if (this.activeDocument) {
      this.http.get(`${window['lumeer'].constants.publicPath}/data/documentversions.json`)
        .map(res => res.json())
        .subscribe(versions => this.activeDocument.versions = versions);
    }
  }

  public fetchDocumentDetailInfo() {
    this.fetchDocumentChat();
    this.fetchDocumentHistory();
  }

  public fetchDocumentHistory() {
    this.activeDocument.history = this.http.get(`${window['lumeer'].constants.publicPath}/data/history.json`)
      .map(res => res.json());
  }

  public fetchDocumentChat() {
    this.activeDocument.chat = this.http.get(`${window['lumeer'].constants.publicPath}/data/chat.json`)
      .map(res => res.json());
  }

  private fetchLinkInfo(link) {
    link.info = this.http.get(`${window['lumeer'].constants.publicPath}/data/linkinfo.json`)
      .map(res => res.json());
  }

  public fetchDocumentDetailFromId(id) {
    if (!id) {
      this.documentDetail = undefined;
    } else {
      this.http.get(`${window['lumeer'].constants.publicPath}/data/documentdetail.json`)
        .map(res => res.json())
        .map(documentDetail => {
          documentDetail.rights = documentDetail.rights.map(oneRight => this.updateRights(oneRight));
          return documentDetail;
        })
        .subscribe(documentDetail => this.documentDetail = documentDetail);
    }
  }

  public fetchFilterResultsFromFilter(filter) {
    if (!filter || filter.length === 0) {
      this.filterResults = undefined;
      this.documentDetail = undefined;
    } else {
      this.http.get(`${window['lumeer'].constants.publicPath}/data/documentsearch.json`)
        .map(res => res.json())
        .subscribe(filterResults => this.filterResults = filterResults);
    }
  }

  public fetchDocumentDetailVersions() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/documentversions.json`)
      .map(res => res.json())
      .subscribe(documentVersions => this.documentDetail.versions = documentVersions);
  }

  private updateRights(oneRight) {
    oneRight.rightBits = oneRight.rights.toString(2).split('').map(right => parseInt(right, 10));
    return oneRight;
  }
}
