import {Component, Output, Input, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {IAutocomplete} from './autocomplete-interface';
import {Observable} from 'rxjs';

@Component({
  selector: 'filter-input',
  template: require('./filter-input.component.html'),
  styles: [ require('./filter-input.component.scss').toString() ]
})

export class FilterInput implements IAutocomplete {
  public value: any;
  @Input() public source: any;
  @Input() public options: any;
  @Input() public placeholder: any;
  @Output() public focus: EventEmitter<any> = new EventEmitter();
  @Output() public onAdd: EventEmitter<any> = new EventEmitter();
  @Output() public change: EventEmitter<any> = new EventEmitter();

  @ViewChild('filterInput') public inputElRef: ElementRef;

  public addItem(dataPayload: any): void {
    this.onAdd.emit(dataPayload);
    this.value = '';
  }

  public onKeyDown($event: any): void {
    let keyCode = $event.keyCode || $event.which;
    if (keyCode === 13 && this.value === '') {
      this.addItem(this.value);
    }
  }

  public onFocus() {
    this.focus.next();
  }

  public ngAfterViewInit() {
    Observable.fromEvent(this.inputElRef.nativeElement, 'keyup')
      .debounceTime(this.options.debounceTime || 1000)
      .subscribe(keyboardEvent => this.change.emit(this.value));
  }
}
