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
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {Collection} from '../../../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {LinkType} from '../../../../../../../../core/store/link-types/link.type';
import {BehaviorSubject} from 'rxjs';
import {SelectConstraintOption, UnknownConstraint} from '@lumeer/data-filters';
import {DropdownOption} from '../../../../../../../../shared/dropdown/options/dropdown-option';
import {findAttribute, getDefaultAttributeId} from '../../../../../../../../core/store/collections/collection.util';
import {OptionsDropdownComponent} from '../../../../../../../../shared/dropdown/options/options-dropdown.component';
import {uniqueValues} from '../../../../../../../../shared/utils/array.utils';
import {HtmlModifier, isElementActive} from '../../../../../../../../shared/utils/html-modifier';
import {keyboardEventCode, KeyCode} from '../../../../../../../../shared/key-code';

@Component({
  selector: 'form-view-cell-link',
  templateUrl: './form-view-cell-link.component.html',
  styleUrls: ['./form-view-cell-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewCellLinkComponent implements OnChanges {
  @Input()
  public multi: boolean;

  @Input()
  public linkType: LinkType;

  @Input()
  public collection: Collection;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public selectedDocumentIds: string[];

  @Input()
  public readonly: boolean;

  @Output()
  public selectedDocumentIdsChange = new EventEmitter<string[]>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  @ViewChild('wrapperElement')
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  public selectedDocuments$ = new BehaviorSubject<DropdownOption[]>([]);
  public dropdownOptions: DropdownOption[];

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
    if (changes.collection || changes.documents || changes.collection) {
      this.createOptions();
    }
  }

  private createOptions() {
    const attributeId = getDefaultAttributeId(this.collection);
    const constraint = findAttribute(this.collection?.attributes, attributeId)?.constraint || new UnknownConstraint();
    this.dropdownOptions = (this.documents || []).map(document => ({
      value: document.id,
      displayValue: constraint.createDataValue(document.data?.[attributeId]).format(), // TODO constraintData
    }));
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

  public trackByOption(index: number, option: SelectConstraintOption): string {
    return option.value;
  }

  public onFocused() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public onBlur() {
    this.removeListeners();
    this.resetScroll();
    this.blurCleanup();
    if (this.preventSave) {
      this.preventSave = false;
    } else if (this.multi) {
      this.saveValue();
    } else if (this.dropdown?.getActiveOption()) {
      this.saveValue(this.dropdown.getActiveOption());
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
  }

  private scrollToEnd() {
    this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  }

  public onSelect(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
      this.dropdown?.resetActiveOption();
    } else {
      this.preventSaveAndBlur();
      this.saveValue(option);
    }
  }

  private saveValue(activeOption?: DropdownOption) {
    if (this.multi) {
      const options = [...this.selectedDocuments$.value, activeOption].filter(option => !!option);
      const ids = uniqueValues(options.map(option => option.value));
      this.selectedDocumentIdsChange.emit(ids);
      this.preventSaveAndBlur();
      return;
    }

    if (activeOption || !this.text) {
      const ids = [activeOption?.value].filter(id => !!id);
      this.selectedDocumentIdsChange.emit(ids);
      this.preventSaveAndBlur();
    } else {
      this.onCancel();
    }

    this.resetSearchInput();
  }

  private onCancel() {
    this.resetScroll();
    this.resetSearchInput();
    this.cancel.emit();
    this.selectedDocuments$.next([]); // TODO
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.textInput?.nativeElement)) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const selectedOption = this.dropdown?.getActiveOption();

        event.preventDefault();

        if (this.multi && keyboardEventCode(event) !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
        } else {
          this.saveValue(selectedOption);
        }
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
      case KeyCode.Backspace:
        if (!this.text && this.multi && this.selectedDocuments$.value.length > 0) {
          this.selectedDocuments$.next(
            this.selectedDocuments$.value.slice(0, this.selectedDocuments$.value.length - 1)
          );
        }
        return;
    }

    this.dropdown?.onKeyDown(event);
  }

  private onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedDocuments$.value.some(o => o.value === option.value)) {
      this.selectedDocuments$.next(this.selectedDocuments$.value.filter(o => o.value !== option.value));
    } else {
      const selectOption = (this.dropdownOptions || []).find(o => o.value === option.value);
      if (selectOption) {
        this.selectedDocuments$.next([...this.selectedDocuments$.value, option]);
        setTimeout(() => this.scrollToEnd());
      }
    }
    this.resetSearchInput();
  }

  private resetSearchInput() {
    this.text = '';
  }
}
