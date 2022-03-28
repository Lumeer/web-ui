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
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {SelectConstraintOption, SelectDataValue} from '@lumeer/data-filters';
import {CommonDataInputConfiguration, SelectDataInputConfiguration} from '../../data-input-configuration';
import {DropdownOption} from '../../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../../dropdown/options/options-dropdown.component';
import {createSelectDataInputDropdownOptions} from '../../select/select-data-input-utils';
import {uniqueValues} from '../../../utils/array.utils';

@Component({
  selector: 'select-data-input-compact',
  templateUrl: './select-data-input-compact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDataInputCompactComponent implements OnChanges {
  @Input()
  public configuration: SelectDataInputConfiguration;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: SelectDataValue;

  @Input()
  public placeholder: string;

  @Output()
  public save = new EventEmitter<SelectDataValue>();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];
  public selectedOptions$ = new BehaviorSubject<SelectConstraintOption[]>([]);
  public dropdownOpened$ = new BehaviorSubject(false);

  public multi: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value && this.value) {
      this.selectedOptions$.next(this.value.options || []);
      this.dropdownOptions = createSelectDataInputDropdownOptions(this.value);
      this.multi = this.value.config?.multi;
    }
  }

  public onDropdownClosed() {
    if (this.dropdownOpened$.value) {
      this.dropdownOpened$.next(false);
      if (this.multi) {
        this.saveValue();
      }
    }
  }

  private saveValue(activeOption?: DropdownOption) {
    if (this.multi) {
      const options = [...this.selectedOptions$.value].filter(option => !!option);
      const optionValues = uniqueValues(options.map(option => option.value));
      const dataValue = this.value.copy(optionValues);
      this.save.emit(dataValue);
    } else {
      const dataValue = this.value.copy(activeOption ? activeOption.value : '');
      this.save.emit(dataValue);
    }
  }

  public onSelect(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
      this.dropdown?.resetActiveOption();
    } else {
      this.dropdownOpened$.next(false);
      this.saveValue(option);
    }
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedOptions$.value.some(o => o.value === option.value)) {
      this.selectedOptions$.next(this.selectedOptions$.value.filter(o => o.value !== option.value));
    } else {
      const selectOption = (this.dropdownOptions || []).find(o => o.value === option.value);
      if (selectOption) {
        const displayValues = this.value.config.displayValues;
        const newOption = displayValues ? selectOption : {...selectOption, displayValue: selectOption.value};
        this.selectedOptions$.next([...this.selectedOptions$.value, newOption]);
      }
    }
  }

  public trackByOption(index: number, option: SelectConstraintOption): string {
    return option.value;
  }

  public onClick(event: MouseEvent) {
    if (!this.dropdownOpened$.value) {
      this.dropdownOpened$.next(true);

      setTimeout(() => this.dropdown?.open());
    }
  }
}
