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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, UntypedFormGroup} from '@angular/forms';

import {DropdownOption} from '../../../../../dropdown/options/dropdown-option';
import {SelectionList} from '../../../selection-list';
import {AttributeSelectionList} from '../../attribute-selection-list';

@Component({
  selector: 'selection-list-modal-content',
  templateUrl: './selection-list-modal-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionListModalContentComponent implements OnChanges {
  @Input()
  public form: UntypedFormGroup;

  @Input()
  public list: SelectionList;

  @Input()
  public attributesSelectionLists: AttributeSelectionList[];

  @Output()
  public listSelected = new EventEmitter<AttributeSelectionList>();

  public selectionListsOptions: DropdownOption[];

  public get nameControl(): AbstractControl {
    return this.form.controls.name;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributesSelectionLists) {
      this.selectionListsOptions = (this.attributesSelectionLists || []).map(list => ({
        value: list.id,
        displayValue: list.name,
        icons: list.icons,
        iconColors: list.colors,
      }));
    }
  }

  public onSelectionListSelected(option: DropdownOption) {
    const selectionList = this.attributesSelectionLists?.find(list => list.id === option.value);
    if (selectionList) {
      this.listSelected.emit(selectionList);
    }
  }
}
