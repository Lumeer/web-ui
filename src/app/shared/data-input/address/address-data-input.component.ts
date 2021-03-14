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
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map, mergeMap} from 'rxjs/operators';
import {GeocodingAction} from '../../../core/store/geocoding/geocoding.action';
import {selectLocationsByQuery} from '../../../core/store/geocoding/geocoding.state';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {KeyCode} from '../../key-code';
import {setCursorAtDataInputEnd} from '../../utils/html-modifier';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {AddressDataValue, ConstraintType} from '@lumeer/data-filters';
import {AppState} from '../../../core/store/app.state';

@Component({
  selector: 'address-data-input',
  templateUrl: './address-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDataInputComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: AddressDataValue;

  @Output()
  public valueChange = new EventEmitter<AddressDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: AddressDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('addressInput')
  public addressInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Address);

  public value$ = new BehaviorSubject('');
  public addressOptions$: Observable<DropdownOption[]>;

  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private setFocus: boolean;

  constructor(private store$: Store<AppState>, private element: ElementRef) {}

  public ngOnInit() {
    this.addressOptions$ = this.bindAddressOptions();
  }

  private bindAddressOptions(): Observable<DropdownOption[]> {
    return this.value$.pipe(
      debounceTime(200),
      mergeMap(value => {
        if (!value || value.length < 3) {
          return of([]);
        }

        this.store$.dispatch(new GeocodingAction.GetLocations({query: value.trim()}));

        return this.store$.pipe(
          select(selectLocationsByQuery(value)),
          map(locations =>
            (locations || []).map(location => ({
              value: this.value.copy(location.address).serialize(),
            }))
          )
        );
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.setFocus = true;
    }
    if (changes.value) {
      this.value$.next(this.value.format());
    }
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.addressInput) {
      setCursorAtDataInputEnd(this.addressInput.nativeElement, this.value);
    }
  }

  private addKeyDownListener() {
    this.removeKeyDownListener();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);
  }

  private removeKeyDownListener() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);

    this.valueChange.emit(dataValue);
    this.value$.next(dataValue.format());
  }

  public onFocused() {
    this.addKeyDownListener();
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public onBlur() {
    this.removeKeyDownListener();

    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const selectedOption = this.dropdown?.getActiveOption();
      if (selectedOption) {
        this.saveValueOnBlur(selectedOption.value);
      } else {
        this.saveValueOnBlur(this.addressInput.nativeElement.value);
      }
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }

    this.value$.next('');
  }

  public onSelectOption(option: DropdownOption) {
    this.preventSaveAndBlur();
    const dataValue = this.value.copy(option.value);
    this.save.emit({action: DataInputSaveAction.Select, dataValue});
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.addressInput;
        const value = input.nativeElement.value;
        const selectedOption = this.dropdown?.getActiveOption();
        const dataValue = this.value.parseInput(selectedOption?.value || value);

        event.preventDefault();

        this.preventSaveAndBlur();
        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private saveDataValue(dataValue: AddressDataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.commonConfiguration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  private preventSaveAndBlur() {
    if (this.addressInput) {
      this.preventSave = true;
      this.addressInput.nativeElement.blur();
    }
  }

  private saveValueOnBlur(value: string) {
    const dataValue = this.value.parseInput(value);
    this.save.emit({action: DataInputSaveAction.Blur, dataValue});
  }
}
