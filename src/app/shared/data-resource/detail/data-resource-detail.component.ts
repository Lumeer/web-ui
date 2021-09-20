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
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import {Action, select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {ResourcesPermissions} from '../../../core/model/allowed-permissions';
import {NotificationService} from '../../../core/notifications/notification.service';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
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
import {AttributesSettings, View, ViewConfig} from '../../../core/store/views/view';
import {DetailTabType} from './detail-tab-type';
import {selectDocumentById, selectDocumentsByIds} from '../../../core/store/documents/documents.state';
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {
  selectLinkInstanceById,
  selectLinkInstancesByDocumentIds,
} from '../../../core/store/link-instances/link-instances.state';
import {getOtherLinkedCollectionId, mapLinkTypeCollections} from '../../utils/link-type.utils';
import {objectChanged} from '../../utils/common.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {DetailConfig} from '../../../core/store/details/detail';
import {selectDetailAttributesSettings, selectDetailById} from '../../../core/store/details/detail.state';
import * as DetailActions from './../../../core/store/details/detail.actions';
import {ViewConfigPerspectiveComponent} from '../../../view/perspectives/view-config-perspective.component';
import {checkOrTransformDetailConfig} from '../../../core/store/details/detail.utils';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../core/store/link-types/link-types.state';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {User} from '../../../core/store/users/user';
import {selectResourcesPermissionsByView} from '../../../core/store/common/permissions.selectors';

@Component({
  selector: 'data-resource-detail',
  templateUrl: './data-resource-detail.component.html',
  styleUrls: ['./data-resource-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDetailComponent
  extends ViewConfigPerspectiveComponent<DetailConfig>
  implements OnInit, OnChanges, OnDestroy {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public query: Query;

  @Input()
  public settingsQuery: Query;

  @Input()
  public settingsStem: QueryStem;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public allowSelectDocument = true;

  @Input()
  public defaultView: View;

  @Output()
  public dataResourceChanged = new EventEmitter<DataResource>();

  @Output()
  public routingPerformed = new EventEmitter();

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  public workspace$: Observable<Workspace>;
  public constraintData$: Observable<ConstraintData>;
  public attributesSettings$: Observable<AttributesSettings>;
  public resourcesPermissions$: Observable<ResourcesPermissions>;
  public linkTypes$: Observable<LinkType[]>;
  public currentUser$: Observable<User>;

  public readonly contactUrl: string;
  public readonly collectionResourceType = AttributesResourceType.Collection;
  public readonly linkTypeResourceType = AttributesResourceType.LinkType;
  public readonly detailTabType = DetailTabType;

  public selectedTab$ = new BehaviorSubject<DetailTabType>(DetailTabType.Detail);
  public settingsQuery$ = new BehaviorSubject<Query>({});
  public defaultView$ = new BehaviorSubject<View>(null);
  public overrideSettings$ = new BehaviorSubject<AttributesSettings>(null);
  public settingsStem$ = new BehaviorSubject<QueryStem>(null);
  public collectionId$ = new BehaviorSubject<string>(null);
  public startEditing$ = new BehaviorSubject<boolean>(false);

  public currentView$: Observable<View>;
  public commentsCount$: Observable<number>;
  public linksCount$: Observable<number>;
  public documentsCount$: Observable<number>;

  public resourceType: AttributesResourceType;
  private workspace: Workspace;

  constructor(
    protected store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspectiveService: PerspectiveService,
    private modalService: ModalService,
    private configurationService: ConfigurationService
  ) {
    super(store$);
    this.contactUrl = configurationService.getConfiguration().contactUrl;
  }

  public get isCollection(): boolean {
    return this.resourceType === AttributesResourceType.Collection;
  }

  public ngOnInit() {
    super.ngOnInit();

    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.workspace$ = combineLatest([this.store$.pipe(select(selectWorkspace)), this.defaultView$]).pipe(
      map(([workspace, defaultView]) => ({...workspace, viewId: defaultView?.id})),
      tap(workspace => (this.workspace = workspace))
    );
    this.currentView$ = combineLatest([this.defaultView$, this.store$.pipe(select(selectCurrentView))]).pipe(
      map(([defaultView, currentView]) => defaultView || currentView)
    );

    this.bindPermissions();
  }

  private bindPermissions() {
    this.resourcesPermissions$ = this.currentView$.pipe(
      switchMap(currentView => this.store$.pipe(select(selectResourcesPermissionsByView(currentView))))
    );

    this.linkTypes$ = combineLatest([
      this.resourcesPermissions$,
      this.store$.pipe(select(selectAllLinkTypes)),
      this.collectionId$.asObservable(),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(
        ([permissions, linkTypes, collectionId, collectionsMap]) =>
          (collectionId &&
            linkTypes
              .filter(linkType => permissions?.linkTypes?.[linkType.id]?.rolesWithView?.Read)
              .filter(linkType => linkType.collectionIds?.includes(collectionId))
              .map(linkType => mapLinkTypeCollections(linkType, collectionsMap))) ||
          []
      ),
      tap(linkTypes => this.readLinkTypesData(linkTypes))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.resource) || objectChanged(changes.dataResource)) {
      this.bindData();
    }
    if (changes.settingsStem) {
      this.settingsStem$.next(this.settingsStem);
    }
    if (changes.settingsQuery) {
      this.settingsQuery$.next(this.settingsQuery);
    }
    if (changes.defaultView) {
      this.defaultView$.next(this.defaultView);
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
      this.documentsCount$ = of(null);
      this.collectionId$.next(this.resource?.id);
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      const linkInstance$ = this.store$.pipe(select(selectLinkInstanceById(this.dataResource.id)));
      this.commentsCount$ = linkInstance$.pipe(
        filter(link => !!link),
        map(link => link.commentsCount)
      );
      this.documentsCount$ = linkInstance$.pipe(
        switchMap(link => this.store$.pipe(select(selectDocumentsByIds(link?.documentIds || [])))),
        map(documents => documents.length)
      );
      this.linksCount$ = of(null);
      this.collectionId$.next(null);
    }

    this.attributesSettings$ = combineLatest([this.overrideSettings$, this.defaultView$, this.settingsStem$]).pipe(
      switchMap(([overrideSettings, defaultView, settingsStem]) => {
        if (overrideSettings) {
          return of(overrideSettings);
        } else if (defaultView?.config?.detail) {
          const stemsConfigs = defaultView.config.detail.stemsConfigs || [];
          const stemConfig = stemsConfigs.find(config => config.stem?.collectionId === this.collectionId$.value);
          return of(stemConfig?.attributesSettings);
        }
        return this.store$.pipe(select(selectDetailAttributesSettings(settingsStem)));
      })
    );
  }

  private readLinkTypesData(linkTypes: LinkType[]) {
    const loadingCollections = new Set();
    const loadingLinkTypes = new Set();
    const workspace = this.workspace;
    linkTypes.forEach(linkType => {
      const otherCollectionId = getOtherLinkedCollectionId(linkType, this.resource.id);

      if (!loadingCollections.has(otherCollectionId)) {
        loadingCollections.add(otherCollectionId);
        const documentsQuery: Query = {stems: [{collectionId: otherCollectionId}]};
        this.store$.dispatch(new DocumentsAction.Get({query: documentsQuery, workspace}));
      }

      if (!loadingLinkTypes.has(linkType.id)) {
        loadingLinkTypes.add(linkType.id);
        const query: Query = {stems: [{collectionId: this.resource.id, linkTypeIds: [linkType.id]}]};
        this.store$.dispatch(new LinkInstancesAction.Get({query, workspace}));
      }
    });
  }

  public onRemove() {
    if (this.isCollection) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: (<DocumentModel>this.dataResource).collectionId,
          documentId: this.dataResource.id,
          workspace: this.workspace,
        })
      );
    } else {
      this.store$.dispatch(
        new LinkInstancesAction.DeleteConfirm({
          linkInstanceId: this.dataResource.id,
          workspace: this.workspace,
        })
      );
    }
  }

  public onUnlink(linkInstance: LinkInstance) {
    this.store$.dispatch(
      new LinkInstancesAction.DeleteConfirm({
        linkInstanceId: linkInstance.id,
        workspace: this.workspace,
      })
    );
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
      this.showAttributeType(this.resource.id, null, attribute.id);
    } else {
      this.showAttributeType(null, this.resource.id, attribute.id);
    }
  }

  public showAttributeType(collectionId: string, linkTypeId: string, attributeId: string) {
    this.modalService.showAttributeType(attributeId, collectionId, linkTypeId, this.workspace);
  }

  public onAttributeFunctionClick(attribute: Attribute) {
    if (this.isCollection) {
      this.showAttributeFunction(this.resource.id, null, attribute.id);
    } else {
      this.showAttributeFunction(null, this.resource.id, attribute.id);
    }
  }

  public showAttributeFunction(collectionId: string, linkTypeId: string, attributeId: string) {
    this.modalService.showAttributeFunction(attributeId, collectionId, linkTypeId, this.workspace);
  }

  public showAttributeDescription(collectionId: string, linkTypeId: string, attributeId: string) {
    this.modalService.showAttributeDescription(attributeId, collectionId, linkTypeId, this.workspace);
  }

  public showModifyLinks(collectionId: string, linkTypeId: string, documentId: string) {
    this.modalService.showModifyDocumentLinks(documentId, collectionId, linkTypeId, this.workspace);
  }

  public showCreateLink(ids: [string, string]) {
    this.modalService.showCreateLink(ids, this.workspace);
  }

  public editNewComment() {
    this.startEditing$.next(true);
    this.selectedTab$.next(DetailTabType.Comments);
  }

  public selectTab(tab: DetailTabType) {
    this.selectedTab$.next(tab);
  }

  public onShowLink(linkTypeId: string) {
    this.store$.dispatch(
      DetailActions.removeCollapsedLink({
        detailId: this.perspectiveId$.value,
        linkTypeId,
      })
    );
  }

  public onHideLink(linkTypeId: string) {
    this.store$.dispatch(
      DetailActions.addCollapsedLink({
        detailId: this.perspectiveId$.value,
        linkTypeId,
      })
    );
  }

  public onShowCollection(collectionId: string) {
    this.store$.dispatch(
      DetailActions.removeCollapsedCollection({
        detailId: this.perspectiveId$.value,
        collectionId,
      })
    );
  }

  public onHideCollection(collectionId: string) {
    this.store$.dispatch(
      DetailActions.addCollapsedCollection({
        detailId: this.perspectiveId$.value,
        collectionId,
      })
    );
  }

  protected selectViewQuery$(): Observable<Query> {
    return this.settingsQuery$.asObservable();
  }

  protected checkOrTransformConfig(
    config: DetailConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): DetailConfig {
    return checkOrTransformDetailConfig(config, query, collections, linkTypes);
  }

  protected configChanged(perspectiveId: string, config: DetailConfig) {
    this.store$.dispatch(DetailActions.add({detail: {id: perspectiveId, config}}));
  }

  protected getConfig(viewConfig: ViewConfig): DetailConfig {
    return viewConfig?.detail;
  }

  protected subscribeConfig$(perspectiveId: string): Observable<DetailConfig> {
    return this.store$.pipe(
      select(selectDetailById(perspectiveId)),
      map(entityConfig => entityConfig?.config)
    );
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
  }

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    if (this.defaultView) {
      this.overrideSettings$.next(attributesSettings);
    } else if (this.settingsStem) {
      this.store$.dispatch(
        DetailActions.setStemAttributes({
          stem: this.settingsStem,
          detailId: this.perspectiveId$.value,
          attributes: attributesSettings,
        })
      );
    }
  }

  public onDocumentSelect(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
    this.selectTab(DetailTabType.Detail);
  }

  public onPatchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document, workspace: this.workspace}));
  }

  public onPatchLinkData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance, workspace: this.workspace}));
  }

  public onCreateDocumentWithLink(data: {document: DocumentModel; linkInstance: LinkInstance}) {
    this.store$.dispatch(
      new DocumentsAction.CreateWithLink({
        document: data.document,
        linkInstance: data.linkInstance,
        otherDocumentId: this.dataResource.id,
        workspace: this.workspace,
      })
    );
  }

  public onCreateLink(data: {linkInstance: LinkInstance}) {
    this.store$.dispatch(new LinkInstancesAction.Create({linkInstance: data.linkInstance, workspace: this.workspace}));
  }

  public onUpdateLink(data: {linkInstance: LinkInstance; nextAction?: Action}) {
    this.store$.dispatch(
      new LinkInstancesAction.Update({
        linkInstance: data.linkInstance,
        nextAction: data.nextAction,
        workspace: this.workspace,
      })
    );
  }
}
