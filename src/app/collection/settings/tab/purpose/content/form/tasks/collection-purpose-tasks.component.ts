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

import {Component, ChangeDetectionStrategy, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Collection, TaskPurposeMetadata} from '../../../../../../../core/store/collections/collection';
import {TaskPurposeFormControl} from './task-purpose-form-control';
import {removeAllFormControls} from '../../../../../../../shared/utils/form.utils';
import {findAttribute} from '../../../../../../../core/store/collections/collection.util';
import {BehaviorSubject, Observable} from 'rxjs';
import {DataInputConfiguration} from '../../../../../../../shared/data-input/data-input-configuration';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {AppState} from '../../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {isArray, isNullOrUndefined, objectChanged} from '../../../../../../../shared/utils/common.utils';
import {DocumentsAction} from '../../../../../../../core/store/documents/documents.action';
import {selectDocumentsByCollectionId} from '../../../../../../../core/store/documents/documents.state';
import {selectConstraintData} from '../../../../../../../core/store/constraint-data/constraint-data.state';
import {map, startWith} from 'rxjs/operators';
import {ConstraintData, ConstraintType, DataValue} from '@lumeer/data-filters';

@Component({
  selector: 'collection-purpose-tasks',
  templateUrl: './collection-purpose-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPurposeTasksComponent implements OnInit, OnChanges {
  @Input()
  public form: FormGroup;

  @Input()
  public collection: Collection;

  @Input()
  public documents: DocumentModel[];

  public readonly controls = TaskPurposeFormControl;
  public readonly constraintType = ConstraintType;

  public readonly dataInputConfiguration: DataInputConfiguration = {select: {wrapItems: true}};

  public stateListEditing$ = new BehaviorSubject(false);
  public stateList$: Observable<any[]>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;

  constructor(private store$: Store<AppState>) {}

  public get assigneeControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Assignee);
  }

  public get dueDateControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.DueDate);
  }

  public get stateControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.State);
  }

  public get stateListControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.StateList);
  }

  public get observersControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Observers);
  }

  public get priorityControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Priority);
  }

  public get tagsControl(): AbstractControl {
    return this.form.get(TaskPurposeFormControl.Tags);
  }

  public ngOnInit() {
    this.resetForm();
    this.createForm();

    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.stateList$ = this.stateListControl.valueChanges.pipe(
      startWith(this.stateListControl.value),
      map(() => this.stateListControl.value)
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.updateForm();
    }
    if (objectChanged(changes.collection) && this.collection) {
      this.updateData();
    }
  }

  private updateForm() {
    const metaData = <TaskPurposeMetadata>this.collection?.purpose?.metaData;
    if (this.form && metaData) {
      this.assigneeControl?.patchValue(metaData.assigneeAttributeId, {emitEvent: false});
      this.dueDateControl?.patchValue(metaData.dueDateAttributeId, {emitEvent: false});
      this.stateControl?.patchValue(metaData.stateAttributeId, {emitEvent: false});
      if (!this.stateListEditing$.value) {
        this.stateListControl?.patchValue(metaData.finalStatesList, {emitEvent: false});
      }
      this.observersControl?.patchValue(metaData.observersAttributeId, {emitEvent: false});
      this.tagsControl?.patchValue(metaData.tagsAttributeId, {emitEvent: false});
      this.priorityControl?.patchValue(metaData.priorityAttributeId, {emitEvent: false});
    }
  }

  private updateData() {
    this.store$.dispatch(new DocumentsAction.Get({query: {stems: [{collectionId: this.collection.id}]}}));
    this.documents$ = this.store$.pipe(select(selectDocumentsByCollectionId(this.collection.id)));
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    const metaData = <TaskPurposeMetadata>this.collection?.purpose?.metaData;
    const assigneeAttribute = findAttribute(this.collection?.attributes, metaData?.assigneeAttributeId);
    this.form.addControl(TaskPurposeFormControl.Assignee, new FormControl(assigneeAttribute?.id));

    const dueDateAttribute = findAttribute(this.collection?.attributes, metaData?.dueDateAttributeId);
    this.form.addControl(TaskPurposeFormControl.DueDate, new FormControl(dueDateAttribute?.id));

    const stateAttribute = findAttribute(this.collection?.attributes, metaData?.stateAttributeId);
    this.form.addControl(TaskPurposeFormControl.State, new FormControl(stateAttribute?.id));
    this.form.addControl(TaskPurposeFormControl.StateList, new FormControl(metaData?.finalStatesList));

    const observerAttribute = findAttribute(this.collection?.attributes, metaData?.observersAttributeId);
    this.form.addControl(TaskPurposeFormControl.Observers, new FormControl(observerAttribute?.id));

    const priorityAttribute = findAttribute(this.collection?.attributes, metaData?.priorityAttributeId);
    this.form.addControl(TaskPurposeFormControl.Priority, new FormControl(priorityAttribute?.id));

    const tagsAttribute = findAttribute(this.collection?.attributes, metaData?.tagsAttributeId);
    this.form.addControl(TaskPurposeFormControl.Tags, new FormControl(tagsAttribute?.id));
  }

  public onStateListSave(dataValue: DataValue) {
    const serializedValue = dataValue.serialize();
    this.stateListControl.patchValue(isArray(serializedValue) ? serializedValue : [serializedValue]);
    this.setStateListEditing(false);
  }

  public setStateListEditing(editing: boolean) {
    this.stateListEditing$.next(editing);
  }

  public onStateListChange(dataValue: DataValue) {
    if (isNullOrUndefined(dataValue.inputValue)) {
      const serializedValue = dataValue.serialize();
      this.stateListControl.patchValue(isArray(serializedValue) ? serializedValue : [serializedValue]);
    }
  }

  public setStateListCancel() {
    this.stateListControl.patchValue(this.collection.purpose?.metaData?.finalStatesList);
    this.stateListEditing$.next(false);
  }
}
