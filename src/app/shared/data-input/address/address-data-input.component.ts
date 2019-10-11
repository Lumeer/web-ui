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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
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
import {AddressDataValue} from '../../../core/model/data-value/address.data-value';
import {GeocodingAction} from '../../../core/store/geocoding/geocoding.action';
import {selectLocationsByQuery} from '../../../core/store/geocoding/geocoding.state';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'address-data-input',
  templateUrl: './address-data-input.component.html',
  styleUrls: ['./address-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDataInputComponent implements OnInit, OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: AddressDataValue;

  @Output()
  public valueChange = new EventEmitter<AddressDataValue>();

  @Output()
  public save = new EventEmitter<AddressDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataBlur = new EventEmitter();

  @Output()
  public focused = new EventEmitter<any>();

  @ViewChild('addressInput', {static: false})
  public addressInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public value$ = new BehaviorSubject('');
  public addressOptions$: Observable<DropdownOption[]>;

  private preventSave: boolean;

  constructor(private store$: Store<{}>) {}

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
      this.preventSave = false;
      setTimeout(() => {
        if (this.addressInput) {
          HtmlModifier.setCursorAtTextContentEnd(this.addressInput.nativeElement);
          this.addressInput.nativeElement.focus();
        }
      });
    }
    if (changes.value) {
      this.value$.next(this.value.format());
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);

    this.valueChange.emit(dataValue);
    this.value$.next(dataValue.format());
  }

  public onFocus() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const value = this.addressInput.nativeElement.value;
      setTimeout(() => {
        if (!this.preventSave) {
          this.preventSave = true;
          this.saveValue(value);
        }
        this.blurCleanup();
      }, 250);
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }

    this.value$.next('');
    this.dataBlur.emit();
  }

  public onSelectOption(option: DropdownOption) {
    if (this.preventSave) {
      return;
    }

    this.preventSave = true;
    const dataValue = this.value.copy(option.value);
    this.save.emit(dataValue);
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.addressInput;
        const selectedOption = this.dropdown.getActiveOption();
        this.preventSave = true;
        // needs to be executed after parent event handlers
        const value = input.nativeElement.value;
        setTimeout(() => {
          if (selectedOption) {
            this.saveValue(selectedOption.value);
          } else {
            input && this.saveValue(value);
          }
        });
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.addressInput.nativeElement.value = this.value.format();
        this.cancel.emit();
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private saveValue(value: string) {
    const dataValue = this.value.parseInput(value);
    this.save.emit(dataValue);
  }
}
