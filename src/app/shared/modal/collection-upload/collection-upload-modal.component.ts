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
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {CollectionsAction} from '../../../core/store/collections/collections.action';
import {BehaviorSubject, Observable} from 'rxjs';
import {Collection, ImportedCollection, ImportType} from '../../../core/store/collections/collection';
import {FormBuilder, FormGroup} from '@angular/forms';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {selectCollectionPermissions} from '../../../core/store/user-permissions/user-permissions.state';

@Component({
  templateUrl: './collection-upload-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionUploadModalComponent implements OnInit {
  @Input()
  public data: string;

  @Input()
  public collectionId: string;

  @Input()
  public type = 'csv';

  public readonly dialogType = DialogType;

  public collection$: Observable<Collection>;
  public permissions$: Observable<AllowedPermissions>;
  public performingAction$ = new BehaviorSubject(false);

  public form: FormGroup = this.fb.group({
    type: ImportType.Append,
    mergeAttributeId: null,
  });

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: FormBuilder
  ) {}

  public ngOnInit() {
    this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
    this.permissions$ = this.store$.pipe(select(selectCollectionPermissions(this.collectionId)));
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    this.performingAction$.next(true);

    const type = this.form.value.type;
    const importedCollection: ImportedCollection = {
      data: this.data,
      type,
      mergeAttributeId: type === ImportType.Update ? this.form.value.mergeAttributeId : undefined,
    };
    const format = 'csv';

    this.store$.dispatch(
      new CollectionsAction.Import({
        format,
        importedCollection,
        collectionId: this.collectionId,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }
}
