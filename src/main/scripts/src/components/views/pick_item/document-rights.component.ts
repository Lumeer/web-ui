import {Component, Input, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {DocumentService} from '../../../services/document.service';

@Component({
  selector: 'document-rights',
  template: require('./document-rights.component.html'),
  styles: [require('./document-rights.component.scss').toString()]
})
export class DocumentRightsComponent implements OnInit {
  public autocompleteOptions = {
    displayKey: 'name',
    keepAfterSubmit: true,
    limit: 5,
    model: ''
  };
  public filteredRights;

  constructor(public documentService: DocumentService) {}

  public ngOnInit(): void {
    this.filteredRights = this.documentService.documentDetail.rights;
  }

  public onFilterChange(dataPayload) {
    this.filteredRights = this.documentService.documentDetail.rights.filter(
      oneRight => oneRight.name.trim().indexOf(dataPayload.trim()) !== -1
    );
  }
}
