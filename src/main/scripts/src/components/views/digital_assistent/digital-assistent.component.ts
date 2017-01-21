import {Component, OnInit} from '@angular/core';
import {DocumentService} from '../../../services/document.service';

@Component({
  selector: 'views-digital-assistent',
  template: require('./digital-assistent.component.html')
})
export class DigitalAssistentComponent implements OnInit {

  constructor(public documentService: DocumentService) {
  }

  public ngOnInit(): void {
    this.documentService.fetchDocumentLinksRowsInfo();
  }

}
