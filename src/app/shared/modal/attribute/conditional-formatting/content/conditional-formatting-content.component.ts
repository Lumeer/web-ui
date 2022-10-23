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

import {Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {UntypedFormArray, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {AttributesResource} from '../../../../../core/model/resource';
import {
  Attribute,
  AttributeFormatting,
  AttributeFormattingGroup,
} from '../../../../../core/store/collections/collection';
import {createRange} from '../../../../utils/array.utils';
import {createActionEquationFromFormArray} from '../../common/conditions/constraint-conditions-form.component';

@Component({
  selector: 'conditional-formatting-content',
  templateUrl: './conditional-formatting-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalFormattingContentComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  @Output()
  public formattingChange = new EventEmitter<AttributeFormatting>();

  public form: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {}

  public ngOnInit() {
    this.form = this.fb.group({
      groups: this.fb.array((this.attribute?.formatting?.groups || []).map(group => this.createGroupControl(group))),
    });
  }

  private createGroupControl(group?: AttributeFormattingGroup): UntypedFormGroup {
    return this.fb.group({
      color: group?.color,
      background: group?.background,
      styles: this.fb.control(group?.styles),
      filters: this.fb.array([]),
    });
  }

  public get groupsControl(): UntypedFormArray {
    return <UntypedFormArray>this.form.controls.groups;
  }

  public onAddGroup() {
    this.groupsControl.push(this.createGroupControl());
  }

  public onDeleteGroup(index: number) {
    this.groupsControl.removeAt(index);
  }

  public onSubmit() {
    const groups: AttributeFormattingGroup[] = createRange(0, this.groupsControl.length).reduce<
      AttributeFormattingGroup[]
    >((groups, index) => {
      const group = this.groupsControl.at(index) as UntypedFormGroup;
      const filtersArray = group.controls.filters as UntypedFormArray;

      groups.push({
        styles: group.value.styles,
        color: group.value.color,
        background: group.value.background,
        equation: createActionEquationFromFormArray(filtersArray),
      });
      return groups;
    }, []);

    this.formattingChange.emit({groups});
  }
}
