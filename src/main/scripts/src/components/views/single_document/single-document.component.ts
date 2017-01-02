import { Component } from '@angular/core';
import {LocalStorage} from 'ng2-webstorage';
import {DocumentService} from '../../../services/document.service';

@Component({
  selector: 'views-single-document',
  template: require('./single-document.component.html')
})

export class SingleDocumentComponent {

  constructor(private documentService: DocumentService) {}

  public ngOnInit() {
    this.documentService.fetchDocumentDetailInfo();
  }
}
