import {Component, Output, EventEmitter, Input} from '@angular/core';
import {DocumentInfoService} from '../../../services/document-info.service';

@Component({
  selector: 'filter-save',
  template: require('./filter-save.component.html'),
  styles: [ require('./filter-save.component.scss').toString() ]
})

export class FilterSave {
  public newFilterName = '';
  public showSave: boolean = false;
  private currentFilter;
  private filterId;
  @Input() public otherActions: any;
  @Output() public onChanged: EventEmitter<any> = new EventEmitter();
  @Output() public onActionClick: EventEmitter<any> = new EventEmitter();

  constructor(public documentInfoService: DocumentInfoService) {
  }

  public onFilterChanged(dataPayload) {
    this.onChanged.emit(dataPayload);
  }

  public onSaveClick() {
    if (this.filterId) {
      this.documentInfoService.filterSaveSubject.next({
        id: this.filterId,
        text: this.newFilterName,
        filter: this.currentFilter
      });
    } else {
      this.documentInfoService.filterSaveSubject.next({
        text: this.newFilterName,
        filter: this.currentFilter
      });
    }
  }

  public ngOnInit() {
    this.currentFilter = this.documentInfoService.lastFilter;
    this.filterId = this.documentInfoService.filterId;
  }

  public actionClick(action) {
    this.onActionClick.emit({action: action});
  }
}
