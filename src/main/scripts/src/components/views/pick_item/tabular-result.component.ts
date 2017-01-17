import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'tabular-result',
  template: require('./tabular-result.component.html'),
  styles: [require('./tabular-result.component.scss').toString()]
})
export class TabularResultComponent implements OnInit {

  @Input() public data: any;
  @Output() public onSelectionChange: EventEmitter<any> = new EventEmitter();
  private numCollections: number;
  private numDocuments: number;

  public ngOnInit(): void {
    if (this.data) {
      this.numCollections = this.data.length;
      this.numDocuments = 0;
      this.data.forEach(c => this.numDocuments += c.documents.length);
    }
  }

  private selectItem(document) {
    this.onSelectionChange.emit(document);
  }

}
