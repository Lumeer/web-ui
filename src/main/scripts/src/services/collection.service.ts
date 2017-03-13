import {Injectable} from '@angular/core';
import {LocalStorage} from 'ng2-webstorage/dist/app';
import {Http} from '@angular/http';

@Injectable()
export class CollectionService {
  // @LocalStorage('lastDocument') public activeDocument;
  public allCollections: any;
  public allIcons: any;

  constructor(private http: Http) {
  }

  public getAllCollections() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/collection-data.json`)
      .map(res => res.json())
      .subscribe(collections => this.allCollections = collections);
  }

  public getAllIcons() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/allicons.json`)
      .map(res => res.json())
      .subscribe(icons => this.allIcons = icons);
  }

/*  public setActiveDocument(document) {
    this.activeDocument = document;
    this.fetchDocumentInfo();
  }

  public fetchDocumentInfo() {
    if (this.activeDocument) {
      this.activeDocument.links.map(link => this.fetchLinkInfo(link));
    }
  }

  private fetchLinkInfo(link) {
    link.info = this.http.get('/data/linkinfo.json')
      .map(res => res.json());
  }*/

  /*@LocalStorage('lastCollection') public activeCollection;

   constructor(private http: Http) {

   }

   public getAllCollections() {
   return this.http.get('/data/collection-data.json')
   .map(res => res.json());
   }

   public addCollection(name: string) {

   }

   public dropCollection(name: string) {

   }*/
}
