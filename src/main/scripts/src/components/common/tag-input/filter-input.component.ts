import {Component, Output, Input, EventEmitter, ViewChild, ElementRef, SimpleChanges} from '@angular/core';
import {IAutocomplete} from './autocomplete-interface';
import {Observable} from 'rxjs';

@Component({
  selector: 'filter-input',
  template: require('./filter-input.component.html'),
  styles: [ require('./filter-input.component.scss').toString() ]
})

export class FilterInput implements IAutocomplete {
  @Input() public value: any;
  @Input() public source: any;
  @Input() public options: any;
  @Input() public placeholder: any;
  @Output() public focus: EventEmitter<any> = new EventEmitter();
  @Output() public onAdd: EventEmitter<any> = new EventEmitter();
  @Output() public onChange: EventEmitter<any> = new EventEmitter();

  public addItem(dataPayload: any): void {
    this.onAdd.emit(dataPayload);
    if (!this.options.keepAfterSubmit) {
      setTimeout(() => this.value = '');
    }
  }

  public onKeyDown($event: any): void {
    let keyCode = $event.keyCode || $event.which;
    if (keyCode === 13) {
      this.addItem(this.value);
    } else {
      this.onChange.emit(this.value);
    }
  }

  public onFocus() {
    this.focus.next();
  }
}
