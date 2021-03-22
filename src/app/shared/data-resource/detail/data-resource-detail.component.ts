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
import {BehaviorSubject, Observable, of} from 'rxjs';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {NotificationService} from '../../../core/notifications/notification.service';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Attribute, Collection} from '../../../core/store/collections/collection';
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
import {ResourceAttributeSettings, ViewSettings} from '../../../core/store/views/view';
import {DetailTabType} from './detail-tab-type';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {filter, map, take} from 'rxjs/operators';
import {
  selectLinkInstanceById,
  selectLinkInstancesByDocumentIds,
} from '../../../core/store/link-instances/link-instances.state';
import {getOtherLinkedCollectionId} from '../../utils/link-type.utils';
import {objectChanged} from '../../utils/common.utils';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {ConstraintData} from '@lumeer/data-filters';
import {ConfigurationService} from '../../../configuration/configuration.service';

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

  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public allowSelectDocument = true;

  @Output()
  public dataResourceChanged = new EventEmitter<DataResource>();

  @Output()
  public routingPerformed = new EventEmitter();

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  public workspace$: Observable<Workspace>;
  public constraintData$: Observable<ConstraintData>;

  public resourceType: AttributesResourceType;
  public readonly collectionResourceType = AttributesResourceType.Collection;

  public selectedTab$ = new BehaviorSubject<DetailTabType>(DetailTabType.Detail);
  public readonly detailTabType = DetailTabType;

  public commentsCount$: Observable<number>;
  public linksCount$: Observable<number>;

  public startEditing$ = new BehaviorSubject<boolean>(false);

  public readonly contactUrl: string;

  constructor(
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspectiveService: PerspectiveService,
    private modalService: ModalService,
    private configurationService: ConfigurationService
  ) {
    this.contactUrl = configurationService.getConfiguration().contactUrl;
  }

  public get isCollection(): boolean {
    return this.resourceType === AttributesResourceType.Collection;
  }

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.resource) || objectChanged(changes.dataResource)) {
      this.bindData();
    }
  }

  private bindData() {
    this.resourceType = getAttributesResourceType(this.resource);

    if (this.resourceType === AttributesResourceType.Collection) {
      this.commentsCount$ = this.store$.pipe(
        select(selectDocumentById(this.dataResource.id)),
        filter(doc => !!doc),
        map(doc => doc.commentsCount)
      );
      this.linksCount$ = this.store$.pipe(
        select(selectLinkInstancesByDocumentIds([this.dataResource.id])),
        map(links => links?.length || 0)
      );
      this.store$
        .pipe(select(selectLinkTypesByCollectionId(this.resource.id)), take(1))
        .subscribe(linkTypes => this.readLinkTypesData(linkTypes));
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      this.commentsCount$ = this.store$.pipe(
        select(selectLinkInstanceById(this.dataResource.id)),
        filter(link => !!link),
        map(link => link.commentsCount)
      );
      this.linksCount$ = of(null);
    }
  }

  private readLinkTypesData(linkTypes: LinkType[]) {
    const loadingCollections = new Set();
    const loadingLinkTypes = new Set();
    linkTypes.forEach(linkType => {
      const otherCollectionId = getOtherLinkedCollectionId(linkType, this.resource.id);

      if (!loadingCollections.has(otherCollectionId)) {
        loadingCollections.add(otherCollectionId);
        const documentsQuery: Query = {stems: [{collectionId: otherCollectionId}]};
        this.store$.dispatch(new DocumentsAction.Get({query: documentsQuery}));
      }

      if (!loadingLinkTypes.has(linkType.id)) {
        loadingLinkTypes.add(linkType.id);
        const query: Query = {stems: [{collectionId: this.resource.id, linkTypeIds: [linkType.id]}]};
        this.store$.dispatch(new LinkInstancesAction.Get({query}));
      }
    });
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

  public editNewComment() {
    this.startEditing$.next(true);
    this.selectedTab$.next(DetailTabType.Comments);
  }

  public selectTab(tab: DetailTabType) {
    this.selectedTab$.next(tab);
  }
}
