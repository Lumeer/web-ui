import {Component} from '@angular/core';
import {DocumentService} from '../../../services/document.service';

@Component({
  selector: 'document-history',
  template: require('./document-history.component.html'),
  styles: [require('./document-history.component.scss').toString()]
})
export class DocumentHistoryComponent {
  public user = {
    name: 'Pavel',
    surname: 'Vomacka',
    accountName: 'pavelVomacka'
  };
  public time = new Date();
  constructor(public documentService: DocumentService) {}

  public ngOnInit() {
    // this.documentService.fetchDocumentDetailVersions();
    console.log(this);
  }
}
