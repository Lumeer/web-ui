import {Component} from '@angular/core';
import {LocalStorage} from 'ng2-webstorage';
import {DocumentService} from '../../../services/document.service';

@Component({
  selector: 'views-active-table',
  template: require('./active-table.component.html')
})

export class ActiveTableComponent {

  constructor(private documentService: DocumentService) {
  }

  public ngOnInit() {
    this.documentService.fetchDocumentDetailInfo();
  }
}
