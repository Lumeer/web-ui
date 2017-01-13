import {EventEmitter} from '@angular/core';
export interface IAutocomplete {
  onAdd: EventEmitter<any>;
  addItem(dataPayload: any, itemIndex?: number): void;
  onKeyDown($event: any, index?: number): void;
}
