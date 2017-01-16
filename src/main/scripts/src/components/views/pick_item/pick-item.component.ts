import {Component} from '@angular/core';
import {DocumentInfoService} from '../../../services/document-info.service';

@Component({
  selector: 'views-pick-item',
  template: require('./pick-item.component.html'),
  styles: [require('./pick-item.component.scss').toString()]
})

export class PickItemComponent {

  constructor(public documentInfoService: DocumentInfoService) {
  }

  public selectItem(document) {
    this.documentInfoService.fetchDocumentDetailFromId(document._id);
  }

  public onFilterChanged(dataPayload) {
    this.documentInfoService.fetchFilterResultsFromFilter(dataPayload);
  }

}
