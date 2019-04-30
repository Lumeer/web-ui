/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {SelectionHelper} from '../../../../shared/document/post-it/util/selection-helper';
import {BehaviorSubject} from 'rxjs';
import {generateCorrelationId} from '../../../../shared/utils/resource.utils';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query';

@Component({
  selector: 'kanban-columns',
  templateUrl: './kanban-columns.component.html',
  styleUrls: ['./kanban-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnsComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  public selectionHelper: SelectionHelper;
  public readonly perspectiveId = generateCorrelationId();

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config || changes.documents) {
        this.checkConfigColumns();
    }
  }

  private checkConfigColumns(){
      const currentColumns = this.config && this.config.columns || [];
  }

  public drop(event: CdkDragDrop<string[]>) {
    console.log(event);
  }

  public ngOnInit() {
    this.selectionHelper = new SelectionHelper(
      new BehaviorSubject<string[]>(this.documents || [].map(d => d.id)),
      key => this.documentRows(key),
      () => 1,
      this.perspectiveId
    );
  }

  private documentRows(key: string): number {
    const document = (this.documents || []).find(document => document.id === key);
    return (document && Object.keys(document.data).length) || 0;
  }
}
