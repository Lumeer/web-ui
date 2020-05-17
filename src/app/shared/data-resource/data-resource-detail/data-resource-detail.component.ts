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
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ConstraintData} from '../../../core/model/data/constraint';
import {NotificationService} from '../../../core/notifications/notification.service';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Attribute} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Query} from '../../../core/store/navigation/query/query';
import {Perspective} from '../../../view/perspectives/perspective';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AppState} from '../../../core/store/app.state';
import {ModalService} from '../../modal/modal.service';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {ViewCursor} from '../../../core/store/navigation/view-cursor/view-cursor';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkType} from '../../../core/store/link-types/link.type';
import {ResourceAttributeSettings} from '../../../core/store/views/view';

@Component({
  selector: 'data-resource-detail',
  templateUrl: './data-resource-detail.component.html',
  styleUrls: ['./data-resource-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDetailComponent implements OnInit, OnChanges {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public ignoreSettingsOnReadPermission: boolean;

  @Input()
  public attributeSettings: ResourceAttributeSettings[];

  @Output()
  public dataResourceChanged = new EventEmitter<DataResource>();

  @Output()
  public routingPerformed = new EventEmitter();

  public workspace$: Observable<Workspace>;
  public constraintData$: Observable<ConstraintData>;

  public resourceType: AttributesResourceType;

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspectiveService: PerspectiveService,
    private modalService: ModalService
  ) {}

  public get isCollection(): boolean {
    return this.resourceType === AttributesResourceType.Collection;
  }

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.resourceType = getAttributesResourceType(this.resource);
  }

  public onRemove() {
    if (this.isCollection) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: (<DocumentModel>this.dataResource).collectionId,
          documentId: this.dataResource.id,
        })
      );
    } else {
      this.store$.dispatch(new LinkInstancesAction.DeleteConfirm({linkInstanceId: this.dataResource.id}));
    }
  }

  public onSwitchToTable() {
    if (this.resource && this.dataResource) {
      this.perspectiveService.switchPerspective(Perspective.Table, this.createCursor(), this.createQueryString());
      this.routingPerformed.emit();
    }
  }

  private createQueryString(): string {
    if (this.isCollection) {
      return convertQueryModelToString({stems: [{collectionId: this.resource.id}]});
    }
    const collectionIds = (<LinkType>this.resource).collectionIds || [];
    return convertQueryModelToString({stems: [{collectionId: collectionIds[0], linkTypeIds: [this.resource.id]}]});
  }

  private createCursor(): ViewCursor {
    if (this.isCollection) {
      return {collectionId: this.resource.id, documentId: this.dataResource.id};
    }
    return {linkTypeId: this.resource.id, linkInstanceId: this.dataResource.id};
  }

  public onAttributeTypeClick(attribute: Attribute) {
    if (this.isCollection) {
      this.modalService.showAttributeType(attribute.id, this.resource.id);
    } else {
      this.modalService.showAttributeType(attribute.id, null, this.resource.id);
    }
  }

  public onAttributeFunctionClick(attribute: Attribute) {
    if (this.isCollection) {
      this.modalService.showAttributeFunction(attribute.id, this.resource.id);
    } else {
      this.modalService.showAttributeFunction(attribute.id, null, this.resource.id);
    }
  }
}
