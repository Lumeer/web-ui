import {
  Component, Input, ElementRef, Renderer, ViewChild, ViewChildren, QueryList, EventEmitter, Output, SimpleChanges
} from '@angular/core';
import {getActionToKey} from './tag-actions';
import {CustomTag} from '../helpers/tag.interface';
import {IAutocomplete} from './autocomplete-interface';

@Component({
  selector: 'tag-input',
  template: require('./tag-input.component.html'),
  styles: [ require('./tag-input.component.scss').toString() ]
})

export class TagInputComponent implements IAutocomplete {
  @Input() public tags: CustomTag[];
  @Input() public placeholder: string;
  @Input() public options: any;
  @Input() public autocompleteOptions: any;

  @Output() public onDelete = new EventEmitter<number>();
  @Output() public onAdd = new EventEmitter<any>();

  @ViewChildren('tagItem') private tagElements: QueryList<ElementRef>;

  private editedItemIndex: number = -1;
  private activeIndex: number = -1;
  public tagValue: string = '';

  constructor(private element: ElementRef, private renderer: Renderer) {}

  public getObjectKeys(objectToDisplay) {
    return Object.keys(objectToDisplay);
  }

  public onItemFocus() {
    this.editedItemIndex = -1;
  }

  public onDbClick(tagIndex) {
    this.editedItemIndex = tagIndex;
  }

  public deleteItem(tagIndex) {
    this.onDelete.emit(tagIndex);
  }

  public addItem(dataPayload, itemIndex) {
    this.onAdd.emit({dataPayload: dataPayload, index: itemIndex});
  }

  public onKeyDown($event, index): void {
    let keyCode = $event.keyCode || $event.which;
    let action = getActionToKey(keyCode);
    action.call(this, $event, index);
  }

  public isTagEditable(tagIndex, tagKey) {
    if (this.tags[tagIndex].hasOwnProperty('readOnly') && this.tags[tagIndex].readOnly.indexOf(tagKey) !== -1) {
      return false;
    }
    return this.editedItemIndex === tagIndex;
  }
}
