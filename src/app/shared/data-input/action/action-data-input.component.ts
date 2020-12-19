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

import {Component, ChangeDetectionStrategy, Input, HostBinding, OnChanges, SimpleChanges} from '@angular/core';
import {DataCursor} from '../data-cursor';
import {ActionDataValue} from '../../../core/model/data-value/action-data.value';
import {ActionDataInputConfiguration} from '../data-input-configuration';
import {ActionConstraintConfig} from '../../../core/model/data/constraint-config';
import {dataMeetsFilters} from '../../../core/store/documents/documents.filters';
import {hasRoleByPermissions} from '../../utils/resource.utils';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {AttributesResource, DataResource} from '../../../core/model/resource';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../../core/store/user-permissions/user-permissions.state';
import {filter, map} from 'rxjs/operators';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {ConstraintData} from '../../../core/model/data/constraint';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'action-data-input',
  templateUrl: './action-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex align-items-center'},
})
export class ActionDataInputComponent implements OnChanges {
  @Input()
  public cursor: DataCursor;

  @Input()
  public config: ActionConstraintConfig;

  @Input()
  public readonly: boolean;

  @Input()
  public value: ActionDataValue;

  @Input()
  public configuration: ActionDataInputConfiguration;

  @HostBinding('class.justify-content-center')
  public center: boolean;

  public enabled$: Observable<boolean>;
  public config$ = new BehaviorSubject<ActionConstraintConfig>(null);

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly) {
      // TODO
    }
    if (changes.configuration) {
      this.center = this.configuration?.center;
    }
    if (changes.cursor) {
      this.enabled$ = this.bindEnabled$();
    }
    if (changes.config) {
      this.config$.next(this.config);
    }
  }

  private bindEnabled$(): Observable<boolean> {
    if (this.cursor.collectionId) {
      return combineLatest([
        this.store$.pipe(select(selectCollectionById(this.cursor.collectionId))),
        this.store$.pipe(select(selectDocumentById(this.cursor.documentId))),
        this.store$.pipe(select(selectCollectionPermissions(this.cursor.collectionId))),
        this.config$,
        this.store$.pipe(select(selectConstraintData)),
      ]).pipe(
        filter(([, , , config]) => !!config),
        map(([collection, document, permissions, config, constraintData]) =>
          this.checkEnabled(collection, document, permissions, config, constraintData)
        )
      );
    } else if (this.cursor.linkTypeId) {
      return combineLatest([
        this.store$.pipe(select(selectLinkTypeById(this.cursor.linkTypeId))),
        this.store$.pipe(select(selectLinkInstanceById(this.cursor.linkInstanceId))),
        this.store$.pipe(select(selectLinkTypePermissions(this.cursor.collectionId))),
        this.config$,
        this.store$.pipe(select(selectConstraintData)),
      ]).pipe(
        filter(([, , , config]) => !!config),
        map(([collection, document, permissions, config, constraintData]) =>
          this.checkEnabled(collection, document, permissions, config, constraintData)
        )
      );
    }

    return of(false);
  }

  private checkEnabled(
    resource: AttributesResource,
    dataResource: DataResource,
    permissions: AllowedPermissions,
    config: ActionConstraintConfig,
    constraintData?: ConstraintData
  ): boolean {
    const filters = config.equation?.equations?.map(eq => eq.filter) || [];
    return (
      dataMeetsFilters(dataResource?.data, resource?.attributes, filters, constraintData, config.equation?.operator) &&
      hasRoleByPermissions(config.role, permissions)
    );
  }

  public onClick() {
    if (this.cursor.collectionId) {
      // TODO
    }
  }
}
