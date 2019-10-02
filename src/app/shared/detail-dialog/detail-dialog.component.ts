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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Observable} from 'rxjs';
import {Query} from '../../core/store/navigation/query/query';
import {selectQuery} from '../../core/store/navigation/navigation.state';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {CollectionPermissionsPipe} from '../pipes/permissions/collection-permissions.pipe';
import {Collection} from '../../core/store/collections/collection';
import {DocumentModel} from '../../core/store/documents/document.model';
import {BsModalRef} from 'ngx-bootstrap';
import {DialogType} from '../../dialog/dialog-type';

@Component({
  selector: 'detail-dialog',
  templateUrl: './detail-dialog.component.html',
  styleUrls: ['./detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDialogComponent implements OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  public readonly dialogType = DialogType;

  public query$: Observable<Query>;

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const {collection, document} = data;
    // this.setQueryWithCollection(collection);
    // this.select(collection, document);
  }
}
