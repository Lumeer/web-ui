import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'documents-rows',
  template: require('./documents-rows.component.html'),
  styles: [require('./documents-rows.component.scss').toString()]
})
export class DocumentsRowsComponent {

  @Input() public documents: any;
  @Input() public columns: any;
  @Input() public collectionInfo: any;
  @Input() public canHover: boolean;
  @Output() public onSelect: EventEmitter<any> = new EventEmitter();

  private selectDocument(doc) {
    this.onSelect.emit(doc);
  }

  private hex2rgba(hex, opacity) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
  }

}
