/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {HtmlModifier, isElementActive} from '../../utils/html-modifier';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {BehaviorSubject} from 'rxjs';
import {SelectItemModel} from '../select-item/select-item.model';
import {createDropdownOptions} from '../select-item/select-item.component';
import {uniqueValues} from '@lumeer/utils';

@Component({
  selector: 'multi-select-item',
  templateUrl: './multi-select-item.component.html',
  styleUrls: ['./multi-select-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectItemComponent implements OnChanges, AfterViewChecked {
  @Input()
  public readonly: boolean;

  @Input()
  public wrapItems: boolean;

  @Input()
  public selectedIds: string[];

  @Input()
  public items: SelectItemModel[];

  @Input()
  public placeholder: string;

  @Output()
  public selectedIdsChange = new EventEmitter<string[]>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('wrapperElement')
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];
  public selectedOptions$ = new BehaviorSubject<DropdownOption[]>([]);

  public text = '';

  private setFocus: boolean;
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private mouseDownListener: (event: MouseEvent) => void;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly) {
      this.addListeners();
      this.resetSearchInput();
      this.setFocus = true;
      this.preventSave = false;
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.items) {
      this.dropdownOptions = createDropdownOptions(this.items);
    }
    if (changes.items || changes.selectedIds) {
      this.selectedOptions$.next(this.dropdownOptions.filter(option => this.selectedIds?.includes(option.value)));
    }
  }

  private addListeners() {
    this.removeListeners();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);

    this.mouseDownListener = event => this.onMouseDown(event);
    this.element.nativeElement.addEventListener('mousedown', this.mouseDownListener);
  }

  private removeListeners() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;

    if (this.mouseDownListener) {
      this.element.nativeElement.removeEventListener('mousedown', this.mouseDownListener);
    }
    this.mouseDownListener = null;
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const selectedOption = this.dropdown?.getActiveOption();

        event.preventDefault();

        if (keyboardEventCode(event) !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
        } else {
          this.preventSaveAndBlur();
          this.saveValue(selectedOption);
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.text && this.selectedOptions$.value.length > 0) {
          this.selectedOptions$.next(this.selectedOptions$.value.slice(0, this.selectedOptions$.value.length - 1));
        }
        return;
    }

    this.dropdown?.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedOptions$.value.some(o => o.value === option.value)) {
      this.selectedOptions$.next(this.selectedOptions$.value.filter(o => o.value !== option.value));
    } else {
      const selectOption = (this.dropdownOptions || []).find(o => o.value === option.value);
      if (selectOption) {
        this.selectedOptions$.next([...this.selectedOptions$.value, selectOption]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();
  }

  private saveValue(activeOption?: DropdownOption) {
    const selectedOption = activeOption && this.dropdownOptions.find(option => option.value === activeOption.value);
    const options = [...this.selectedOptions$.value, selectedOption].filter(option => !!option);
    const optionValues = uniqueValues(options.map(option => option.value));
    this.selectedIdsChange.emit(optionValues);
  }

  private resetSearchInput() {
    this.text = '';
  }

  public onSelect(option: DropdownOption) {
    this.toggleOption(option);
    this.dropdown?.resetActiveOption();
  }

  public onBlur() {
    this.removeListeners();
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      this.saveValue();
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.textInput?.nativeElement)) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
      this.removeListeners();
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onFocused() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  private onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  public trackByOption(index: number, option: DropdownOption): string {
    return option.value;
  }
}
