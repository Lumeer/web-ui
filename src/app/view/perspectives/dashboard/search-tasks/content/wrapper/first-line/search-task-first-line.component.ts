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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {Collection} from '../../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {TaskAttributes} from '../../../model/task-attributes';
import {DataInputConfiguration} from '../../../../../../../shared/data-input/data-input-configuration';
import {DataResourcePermissions} from '../../../../../../../core/model/data-resource-permissions';
import {View} from '../../../../../../../core/store/views/view';
import {DocumentsAction} from '../../../../../../../core/store/documents/documents.action';
import {AppState} from '../../../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'search-task-first-line',
  templateUrl: './search-task-first-line.component.html',
  styleUrls: ['./search-task-first-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTaskFirstLineComponent {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public large: boolean;

  @Input()
  public view: View;

  @Input()
  public dataPermissions: DataResourcePermissions;

  @Input()
  public attributes: TaskAttributes;

  @Output()
  public detail = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter();

  public readonly configuration: DataInputConfiguration = {
    common: {inline: true},
  };
  public readonly stateConfiguration: DataInputConfiguration = {
    ...this.configuration,
    color: {compactMode: true},
  };
  public readonly assigneeConfiguration: DataInputConfiguration = {
    ...this.configuration,
    user: {allowCenterOnlyIcon: true, onlyIcon: true},
  };

  public editing$ = new BehaviorSubject(false);

  constructor(private store$: Store<AppState>) {}

  public onStateClick() {
    if (!this.editing$.value) {
      this.editing$.next(true);
    }
  }

  public onStateCancel() {
    this.editing$.next(false);
  }

  public onStateSave(dataValue: DataValue) {
    this.editing$.next(false);
    if (this.document) {
      const patchDocument = {
        collectionId: this.document.collectionId,
        id: this.document.id,
        data: {[this.attributes.state.id]: dataValue.serialize()},
      };
      this.store$.dispatch(
        new DocumentsAction.PatchData({document: patchDocument, workspace: {viewId: this.view?.id}})
      );
    }
  }
}
