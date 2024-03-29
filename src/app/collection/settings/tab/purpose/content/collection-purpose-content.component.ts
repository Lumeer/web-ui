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
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {Subscription} from 'rxjs';

import {
  Collection,
  CollectionPurpose,
  CollectionPurposeMetadata,
  CollectionPurposeType,
  collectionPurposesMap,
} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {TaskPurposeFormControl} from './form/tasks/task-purpose-form-control';
import {UpdatePurposeService} from './update-purpose.service';

@Component({
  selector: 'collection-purpose-content',
  templateUrl: './collection-purpose-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UpdatePurposeService],
})
export class CollectionPurposeContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public workspace: Workspace;

  @Input()
  public documents: DocumentModel[];

  public form = new UntypedFormGroup({
    type: new UntypedFormControl(),
    metaData: new UntypedFormGroup({}),
  });

  private subscriptions = new Subscription();

  constructor(private updatePurposeService: UpdatePurposeService) {}

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get metaDataForm(): AbstractControl {
    return this.form.get('metaData');
  }

  public ngOnInit() {
    this.subscribeFormChanges();

    this.updatePurposeService.setWorkspace(this.workspace);
  }

  private subscribeFormChanges() {
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        const purpose = this.createPurpose();
        this.updatePurposeService.set(this.collection.id, purpose, this.collection);
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.purposeTypeChanges(changes.collection) && this.collection) {
      this.typeControl.setValue(this.collection.purpose?.type || CollectionPurposeType.None);
    }
  }

  private purposeTypeChanges(change: SimpleChange): boolean {
    return (
      change && (!change.previousValue || change.previousValue.purpose?.type !== change.currentValue?.purpose?.type)
    );
  }

  private createPurpose(): CollectionPurpose {
    const type = collectionPurposesMap[this.typeControl.value] || CollectionPurposeType.None;
    return {type, metaData: this.createPurposeMetadata(type)};
  }

  private createPurposeMetadata(type: CollectionPurposeType): CollectionPurposeMetadata {
    switch (type) {
      case CollectionPurposeType.Tasks:
        const stateAttributeId = this.metaDataForm.get(TaskPurposeFormControl.State)?.value;
        return {
          assigneeAttributeId: this.metaDataForm.get(TaskPurposeFormControl.Assignee)?.value,
          dueDateAttributeId: this.metaDataForm.get(TaskPurposeFormControl.DueDate)?.value,
          stateAttributeId,
          finalStatesList: stateAttributeId ? this.metaDataForm.get(TaskPurposeFormControl.StateList)?.value : [],
          observersAttributeId: this.metaDataForm.get(TaskPurposeFormControl.Observers)?.value,
          tagsAttributeId: this.metaDataForm.get(TaskPurposeFormControl.Tags)?.value,
          priorityAttributeId: this.metaDataForm.get(TaskPurposeFormControl.Priority)?.value,
          defaultViewCode: this.metaDataForm.get(TaskPurposeFormControl.View)?.value,
        };
      default:
        return {};
    }
  }

  public ngOnDestroy() {
    this.updatePurposeService.onDestroy();
    this.subscriptions.unsubscribe();
  }
}
