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
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {HtmlModifier, isElementActive} from '../../utils/html-modifier';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {uniqueValues} from '../../utils/array.utils';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {BehaviorSubject, Observable} from 'rxjs';
import {ConstraintType, ViewDataValue} from '@lumeer/data-filters';
import {View} from '../../../core/store/views/view';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {deepObjectsEquals} from '../../utils/common.utils';

@Component({
  selector: 'view-data-input',
  templateUrl: './view-data-input.component.html',
  styleUrls: ['./view-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDataInputComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: ViewDataValue;

  @Input()
  public fontColor: string;

  @Output()
  public valueChange = new EventEmitter<ViewDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: ViewDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('wrapperElement')
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.View);

  public name: string = '';
  public views: View[];
  public selectedViews$ = new BehaviorSubject<View[]>([]);
  public multi: boolean;
  public newWindow: boolean;

  public collectionsMap$: Observable<Record<string, Collection>>;
  public workspace$: Observable<Workspace>;

  private setFocus: boolean;
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private mouseDownListener: (event: MouseEvent) => void;

  constructor(private element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.addListeners();
      this.resetSearchInput();
      this.setFocus = true;
      this.preventSave = false;
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.value && this.value) {
      this.selectedViews$.next(this.value.views || []);
      this.views = this.value.constraintData?.views || [];
      this.multi = this.value.config?.multi;
      this.name = this.value.inputValue || '';
      this.newWindow = this.value.config?.openInNewWindow;
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

        if (this.multi && keyboardEventCode(event) !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
          this.dropdown.resetActiveOption();
        } else {
          this.preventSaveAndBlur();
          const action = keyboardEventInputSaveAction(event);
          if (this.commonConfiguration?.delaySaveAction) {
            // needs to be executed after parent event handlers
            setTimeout(() => this.saveValue(action, selectedOption));
          } else {
            this.saveValue(action, selectedOption);
          }
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.name && this.multi && this.selectedViews$.value.length > 0) {
          this.selectedViews$.next(this.selectedViews$.value.slice(0, this.selectedViews$.value.length - 1));
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedViews$.value.some(o => o.id === option.value)) {
      this.selectedViews$.next(this.selectedViews$.value.filter(o => o.id !== option.value));
    } else {
      const selectedView = (this.views || []).find(o => o.id === option.value);
      if (selectedView) {
        this.selectedViews$.next([...this.selectedViews$.value, selectedView]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();
  }

  private saveValue(action: DataInputSaveAction, activeOption?: DropdownOption) {
    if (this.multi) {
      const selectedUser = activeOption && this.views.find(view => view.id === activeOption.value);
      const viewIds = uniqueValues(
        [...this.selectedViews$.value, selectedUser].filter(view => !!view).map(view => view.id)
      );
      const dataValue = this.value.copy(viewIds);
      this.emitSave(dataValue, action);
      return;
    }

    if (activeOption || !this.name) {
      this.saveValueByOption(action, activeOption);
    } else {
      if (action === DataInputSaveAction.Enter) {
        this.enterInvalid.emit();
      } else {
        this.cancel.emit();
      }
    }
    this.resetSearchInput();
  }

  private saveValueByOption(action: DataInputSaveAction, option: DropdownOption) {
    const view = option && (this.views || []).find(v => v.id === option.value);
    const dataValue = this.value.copy(view?.id || '');
    this.emitSave(dataValue, action);
  }

  private emitSave(dataValue: ViewDataValue, action: DataInputSaveAction) {
    if (deepObjectsEquals(dataValue.serialize(), this.value.serialize())) {
      this.cancel.emit();
    } else {
      this.save.emit({action, dataValue});
    }
  }

  private resetSearchInput() {
    this.name = '';
  }

  public onInputChange() {
    const dataValue = this.value.parseInput(this.name);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.removeListeners();
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else if (this.multi) {
      this.saveValue(DataInputSaveAction.Blur);
    } else if (this.dropdown?.getActiveOption()) {
      this.saveValue(DataInputSaveAction.Blur, this.dropdown.getActiveOption());
    } else {
      this.cancel.emit();
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

  public onSelectOption(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
    } else {
      this.preventSaveAndBlur();
      this.saveValue(DataInputSaveAction.Select, option);
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

  public trackByView(index: number, view: View): string {
    return view.id;
  }
}
