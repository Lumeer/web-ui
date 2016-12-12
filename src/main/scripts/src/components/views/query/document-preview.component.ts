import {Component, trigger, state, style, transition, group, animate} from '@angular/core';
import {Http} from '@angular/http';
@Component({
  selector: 'document-preview',
  template: require('./document-preview.component.html'),
  styles: [ require('./document-preview.component.scss').toString() ]
})

export class DocumentPreviewComponent {
  constructor(private http: Http) {}
  public documents: any[];

  public ngOnInit() {
    setTimeout(() => this.fetchDocumentPreviews(), 2000);
  }

  private fetchDocumentPreviews() {
    this.http.get('/data/documentpreview.json')
      .map(res => res.json())
      .subscribe(documents => this.documents = documents);
  }
}
