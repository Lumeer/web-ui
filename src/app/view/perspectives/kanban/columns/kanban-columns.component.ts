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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Observable} from 'rxjs';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query';
import {User} from '../../../../core/store/users/user';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {distinctUntilChanged} from 'rxjs/operators';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {CollectionsPermissionsPipe} from '../../../../shared/pipes/permissions/collections-permissions.pipe';

@Component({
  selector: 'kanban-columns',
  templateUrl: './kanban-columns.component.html',
  styleUrls: ['./kanban-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnsComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @Output()
  public removeDocument = new EventEmitter<DocumentModel>();

  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public currentUser$: Observable<User>;

  constructor(private store$: Store<AppState>, private collectionsPermissionsPipe: CollectionsPermissionsPipe) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections) {
      this.permissions$ = this.collectionsPermissionsPipe
        .transform(this.collections)
        .pipe(distinctUntilChanged((x, y) => deepObjectsEquals(x, y)));
    }
  }

  public dropColumn(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const columns = [...this.config.columns];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);

    const newConfig = {...this.config, columns};
    this.configChange.next(newConfig);
  }

  public trackByColumn(index: number, column: KanbanColumn): string {
    return column.title || '';
  }

  public onPatchData(document: DocumentModel) {
    this.patchData.emit(document);
  }

  public onColumnsChange(data: {columns: KanbanColumn[]; otherColumn: KanbanColumn}) {
    const config = {...this.config, columns: data.columns, otherColumn: data.otherColumn};
    this.configChange.next(config);
  }

  public onRemoveDocument(document: DocumentModel) {
    this.removeDocument.emit(document);
  }
}
