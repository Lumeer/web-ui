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

import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Collection, TaskPurposeMetadata} from '../../../../../../../core/store/collections/collection';
import {TaskPurposeFormControl} from './task-purpose-form-control';
import {ConstraintType} from '../../../../../../../core/model/data/constraint';
import {removeAllFormControls} from '../../../../../../../shared/utils/form.utils';

@Component({
  selector: 'collection-purpose-tasks',
  templateUrl: './collection-purpose-tasks.component.html',
  styleUrls: ['./collection-purpose-tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPurposeTasksComponent implements OnInit {
  @Input()
  public form: FormGroup;

  @Input()
  public collection: Collection;

  public readonly controls = TaskPurposeFormControl;
  public readonly constraintType = ConstraintType;

  public get assigneeControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Assignee);
  }

  public get dueDateControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.DueDate);
  }

  public get stateControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.State);
  }

  public get observersControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Observers);
  }

  public ngOnInit() {
    this.resetForm();
    this.createForm();
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    const metaData = <TaskPurposeMetadata>this.collection?.purpose?.metaData;
    this.form.addControl(TaskPurposeFormControl.Assignee, new FormControl(metaData?.assigneeAttributeId));
    this.form.addControl(TaskPurposeFormControl.DueDate, new FormControl(metaData?.dueDateAttributeId));
    this.form.addControl(TaskPurposeFormControl.State, new FormControl(metaData?.stateAttributeId));
    this.form.addControl(TaskPurposeFormControl.Observers, new FormControl(metaData?.observersAttributeId));
  }
}
