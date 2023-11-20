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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';

import {AttributeLock, AttributeLockExceptionGroup, AttributeLockGroupType} from '@lumeer/data-filters';

import {AttributesResource} from '../../../../../core/model/resource';
import {Attribute} from '../../../../../core/store/collections/collection';
import {createRange} from '../../../../utils/array.utils';
import {createActionEquationFromFormArray} from '../../common/conditions/constraint-conditions-form.component';

@Component({
  selector: 'attribute-lock-content',
  templateUrl: './attribute-lock-content.component.html',
  styleUrls: ['./attribute-lock-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockContentComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  @Output()
  public lockChange = new EventEmitter<AttributeLock>();

  public form: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {}

  public ngOnInit() {
    this.form = this.fb.group({
      locked: this.attribute?.lock?.locked,
      groups: this.fb.array((this.attribute?.lock?.exceptionGroups || []).map(group => this.createGroupControl(group))),
    });
  }

  private createGroupControl(group?: AttributeLockExceptionGroup): UntypedFormGroup {
    return new UntypedFormGroup({
      type: this.fb.control(group?.type || AttributeLockGroupType.Everyone),
      typeValue: this.fb.control(group?.typeValue),
      filters: this.fb.array([]),
    });
  }

  public get lockedControl(): AbstractControl {
    return this.form.controls.locked;
  }

  public get groupsControl(): UntypedFormArray {
    return <UntypedFormArray>this.form.controls.groups;
  }

  public onSubmit() {
    const exceptionGroups: AttributeLockExceptionGroup[] = createRange(0, this.groupsControl.length).reduce<
      AttributeLockExceptionGroup[]
    >((groups, index) => {
      const group = this.groupsControl.at(index) as UntypedFormGroup;
      const filtersArray = group.controls.filters as UntypedFormArray;

      groups.push({
        type: group.value.type,
        typeValue: group.value.typeValue,
        equation: createActionEquationFromFormArray(filtersArray),
      });
      return groups;
    }, []);
    const locked = this.lockedControl.value;

    this.lockChange.emit({locked, exceptionGroups});
  }

  public onAddGroup() {
    this.groupsControl.push(this.createGroupControl());
  }

  public onDeleteGroup(index: number) {
    this.groupsControl.removeAt(index);
  }
}
