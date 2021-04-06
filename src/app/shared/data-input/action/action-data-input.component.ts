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
  Component,
  ChangeDetectionStrategy,
  Input,
  HostBinding,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import {DataCursor} from '../data-cursor';
import {ActionDataInputConfiguration} from '../data-input-configuration';
import {BehaviorSubject, combineLatest, concat, Observable, of} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectDocumentActionExecutedTime, selectDocumentById} from '../../../core/store/documents/documents.state';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../../core/store/user-permissions/user-permissions.state';
import {delay, filter, map, switchMap, tap} from 'rxjs/operators';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {
  selectLinkInstanceActionExecutedTime,
  selectLinkInstanceById,
} from '../../../core/store/link-instances/link-instances.state';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {objectsByIdMap, preventEvent} from '../../utils/common.utils';
import {AttributesResource, DataResource} from '../../../core/model/resource';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {filterAttributesByFilters} from '../../utils/attribute.utils';
import {
  ActionConstraintConfig,
  ActionDataValue,
  ConstraintData,
  createDataValuesMap,
  isActionButtonEnabled,
} from '@lumeer/data-filters';
import {actionConstraintConfirmationPlaceholder} from '../../modal/attribute-type/form/constraint-config/action/action-constraint.utils';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';

const loadingTime = 2000;

@Component({
  selector: 'action-data-input',
  templateUrl: './action-data-input.component.html',
  styleUrls: ['./action-data-input.component.scss'],
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

  @Output()
  public cancel = new EventEmitter();

  @HostBinding('class.justify-content-center')
  public center: boolean;

  public enabled$: Observable<boolean>;
  public loading$: Observable<boolean>;
  public config$ = new BehaviorSubject<ActionConstraintConfig>(null);

  private enabled: boolean;
  private loading: boolean;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.enabled) {
      if (this.enabled && !this.loading) {
        this.runRule();
      }
      this.cancel.emit();
    }
    if (changes.configuration) {
      this.center = this.configuration?.center;
    }
    if (changes.cursor) {
      this.loading$ = this.bindLoading$().pipe(tap(loading => (this.loading = loading)));
      this.enabled$ = this.bindEnabled$().pipe(tap(enabled => (this.enabled = enabled)));
    }
    if (changes.config) {
      this.config$.next(this.config);
    }
  }

  private bindLoading$(): Observable<boolean> {
    if (this.cursor?.collectionId && this.cursor?.documentId) {
      return this.store$.pipe(
        select(selectDocumentActionExecutedTime(this.cursor?.documentId, this.cursor?.attributeId)),
        switchMap(executedTime => this.checkLoading(executedTime))
      );
    } else if (this.cursor?.linkTypeId && this.cursor?.linkInstanceId) {
      return this.store$.pipe(
        select(selectLinkInstanceActionExecutedTime(this.cursor?.linkInstanceId, this.cursor?.attributeId)),
        switchMap(executedTime => this.checkLoading(executedTime))
      );
    }

    return of(false);
  }

  private checkLoading(executedTime: number): Observable<boolean> {
    if (!executedTime) {
      return of(false);
    }
    const delayTime = Math.min(loadingTime - (new Date().getTime() - executedTime), loadingTime);
    if (delayTime > 0) {
      return concat(of(true), of(false).pipe(delay(delayTime)));
    }
    return of(false);
  }

  private bindEnabled$(): Observable<boolean> {
    if (this.cursor?.collectionId && this.cursor?.documentId) {
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
    } else if (this.cursor?.linkTypeId && this.cursor?.linkInstanceId) {
      return combineLatest([
        this.store$.pipe(select(selectLinkTypeById(this.cursor.linkTypeId))),
        this.store$.pipe(select(selectLinkInstanceById(this.cursor.linkInstanceId))),
        this.store$.pipe(select(selectLinkTypePermissions(this.cursor.linkTypeId))),
        this.config$,
        this.store$.pipe(select(selectConstraintData)),
      ]).pipe(
        filter(([, , , config]) => !!config),
        map(([linkType, linkInstance, permissions, config, constraintData]) =>
          this.checkEnabled(linkType, linkInstance, permissions, config, constraintData)
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
    if (!resource || !dataResource) {
      return false;
    }
    const filters = config.equation?.equations?.map(eq => eq.filter) || [];
    const dataValues = createDataValuesMap(
      dataResource.data,
      filterAttributesByFilters(resource.attributes, filters),
      constraintData
    );
    const attributesMap = objectsByIdMap(resource.attributes);
    return isActionButtonEnabled(dataValues, attributesMap, permissions, config, constraintData);
  }

  public onClick(event: MouseEvent) {
    preventEvent(event);
    if (this.value.config?.requiresConfirmation) {
      this.showConfirmation();
    } else {
      this.runRule();
    }
  }

  private showConfirmation() {
    const title = $localize`:@@constraint.action.confirmation.label:Confirmation`;
    const message =
      this.value.config?.confirmationTitle?.trim() ||
      actionConstraintConfirmationPlaceholder(this.value.config?.title || '');
    const action = this.runRuleAction();
    if (action) {
      this.store$.dispatch(new NotificationsAction.Confirm({title, message, action, type: 'warning'}));
    }
  }

  private runRule() {
    const action = this.runRuleAction();
    if (action) {
      this.store$.dispatch(action);
    }
  }

  private runRuleAction(): Action {
    if (this.cursor?.collectionId && this.cursor?.documentId) {
      return new DocumentsAction.RunRule({
        collectionId: this.cursor.collectionId,
        documentId: this.cursor.documentId,
        attributeId: this.cursor.attributeId,
        actionName: this.config.title,
      });
    } else if (this.cursor?.linkTypeId && this.cursor?.linkInstanceId) {
      return new LinkInstancesAction.RunRule({
        linkTypeId: this.cursor.linkTypeId,
        linkInstanceId: this.cursor.linkInstanceId,
        attributeId: this.cursor.attributeId,
        actionName: this.config.title,
      });
    }
    return null;
  }
}
