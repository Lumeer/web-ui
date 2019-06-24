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
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map, mergeMap} from 'rxjs/operators';
import {GeoCodingService} from '../../../core/geocoding/geocoding.service';
import {AddressConstraintConfig} from '../../../core/model/data/constraint-config';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {KeyCode} from '../../key-code';
import {formatAddressDataValue, formatTextDataValue} from '../../utils/data.utils';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'address-data-input',
  templateUrl: './address-data-input.component.html',
  styleUrls: ['./address-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDataInputComponent implements OnInit, OnChanges {
  @Input()
  public constraintConfig: AddressConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public focused = new EventEmitter<any>();

  @ViewChild('addressInput', {static: false})
  public addressInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public value$ = new BehaviorSubject('');
  public addressOptions$: Observable<DropdownOption[]>;

  private preventSave: boolean;

  constructor(private geoCodingService: GeoCodingService) {}

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

        return this.geoCodingService.suggestAddressesForQuery(value).pipe(
          map(addresses =>
            (addresses || []).map(address => ({
              value: formatAddressDataValue(value, this.constraintConfig, {[value]: [address]}),
            }))
          )
        );
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        if (this.addressInput) {
          HtmlModifier.setCursorAtTextContentEnd(this.addressInput.nativeElement);
          this.addressInput.nativeElement.focus();
        }
      });
    }
    if (changes.value) {
      this.value$.next(this.value || this.value === 0 ? String(this.value) : '');
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.valueChange.emit(element.value);
    this.value$.next(element.value);
  }

  public onFocus() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue(this.addressInput);
    }

    if (this.dropdown) {
      this.dropdown.close();
    }

    this.value$.next('');
  }

  public onSelectOption(option: DropdownOption) {
    this.save.emit(option.value);
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
        setTimeout(() => {
          if (selectedOption) {
            this.save.emit(selectedOption.value);
          } else {
            input && this.saveValue(input);
          }
        });
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.addressInput.nativeElement.value = formatTextDataValue(this.value);
        this.cancel.emit();
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private saveValue(input: ElementRef) {
    this.save.emit(input.nativeElement.value);
  }
}
