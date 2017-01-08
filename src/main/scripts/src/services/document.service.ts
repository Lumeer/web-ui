import {Injectable} from '@angular/core';
import {LocalStorage} from 'ng2-webstorage/dist/app';
import {Http} from '@angular/http';

@Injectable()
export class DocumentService {
  @LocalStorage('lastDocument') public activeDocument;

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

  public fetchDocumentVersions(){
    if (this.activeDocument) {
      this.http.get('/data/documentversions.json')
        .map(res => res.json())
        .subscribe(versions => this.activeDocument.versions = versions);
    }
  }

  public fetchDocumentDetailInfo() {
    this.fetchDocumentChat();
    this.fetchDocumentHistory();
  }

  public fetchDocumentHistory() {
    this.activeDocument.history = this.http.get('/data/history.json')
      .map(res => res.json())
  }

  public fetchDocumentChat() {
    this.activeDocument.chat = this.http.get('/data/chat.json')
      .map(res => res.json())
  }

  private fetchLinkInfo(link) {
    link.info = this.http.get('/data/linkinfo.json')
      .map(res => res.json());
  }
}
