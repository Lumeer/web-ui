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
  HostListener,
  Input,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {KeyCode} from '../../key-code';
import {BehaviorSubject, combineLatest, Observable, of, Subject, Subscription} from 'rxjs';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {DialogType} from '../dialog-type';
import {selectAllCollections, selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectAllLinkTypes, selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {Collection} from '../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../../core/store/user-permissions/user-permissions.state';
import {
  createFlatCollectionSettingsQueryStem,
  createFlatLinkTypeSettingsQueryStem,
  createFlatResourcesSettingsQuery,
} from '../../../core/store/details/detail.utils';
import {map} from 'rxjs/operators';
import {LinkType} from '../../../core/store/link-types/link.type';
import {isDocumentMyTaskAssigned} from '../../../core/store/documents/document.utils';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'data-resource-detail-modal',
  templateUrl: './data-resource-detail-modal.component.html',
  styleUrls: ['./data-resource-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDetailModalComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Input()
  public createDirectly: boolean;

  @Output()
  public dataResourceChanged = new EventEmitter<DataResource>();

  public readonly dialogType = DialogType;
  public readonly collectionResourceType = AttributesResourceType.Collection;

  public resourceType: AttributesResourceType;

  public onSubmit$ = new Subject<DataResource>();
  public onCancel$ = new Subject();
  public performingAction$ = new BehaviorSubject(false);

  public query$: Observable<Query>;
  public settingsQuery$: Observable<Query>;
  public resource$: Observable<AttributesResource>;
  public dataResource$: Observable<DataResource>;
  public permissions$: Observable<AllowedPermissions>;

  public detailSettingsQueryStem: QueryStem;
  public isTaskDataResource$: Observable<boolean>;

  private dataExistSubscription = new Subscription();
  private currentDataResource: DataResource;
  private initialModalsCount: number;

  constructor(
    private store$: Store<AppState>,
    private bsModalRef: BsModalRef,
    private bsModalService: BsModalService
  ) {}

  public ngOnInit() {
    this.initData();
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.settingsQuery$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => createFlatResourcesSettingsQuery(collections, linkTypes)));
    this.initialModalsCount = this.bsModalService.getModalsCount();
  }

  private initData() {
    this.setData(this.resource, this.dataResource);
  }

  private setData(resource: AttributesResource, dataResource: DataResource) {
    this.resourceType = getAttributesResourceType(resource);
    this.resource$ = this.selectResource$(resource.id);
    this.dataResource$ = dataResource?.id ? this.selectDataResource$(dataResource.id) : of(dataResource);
    this.permissions$ = this.selectPermissions$(resource);

    if (this.resourceType === AttributesResourceType.Collection) {
      this.isTaskDataResource$ = this.store$.pipe(
        select(selectConstraintData),
        map(constraintData => isDocumentMyTaskAssigned(<DocumentModel>dataResource, resource, constraintData))
      );
      this.detailSettingsQueryStem = createFlatCollectionSettingsQueryStem(resource);
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      this.isTaskDataResource$ = of(false);
      this.detailSettingsQueryStem = createFlatLinkTypeSettingsQueryStem(<LinkType>resource);
    }

    this.subscribeExist(resource, dataResource);
    this.currentDataResource = dataResource;
  }

  private subscribeExist(resource: AttributesResource, dataResource: DataResource) {
    this.dataExistSubscription.unsubscribe();
    this.dataExistSubscription = combineLatest([
      resource.id ? this.selectResource$(resource.id) : of(true),
      dataResource.id ? this.selectDataResource$(dataResource.id) : of(true),
    ]).subscribe(([currentResource, currentDataResource]) => {
      if (!currentResource || !currentDataResource) {
        this.hideDialog();
      }
    });
  }

  private selectResource$(id: string): Observable<AttributesResource> {
    if (this.resourceType === AttributesResourceType.Collection) {
      return this.store$.pipe(select(selectCollectionById(id)));
    }
    return this.store$.pipe(select(selectLinkTypeById(id)));
  }

  private selectDataResource$(id: string): Observable<DataResource> {
    if (this.resourceType === AttributesResourceType.Collection) {
      return this.store$.pipe(select(selectDocumentById(id)));
    }
    return this.store$.pipe(select(selectLinkInstanceById(id)));
  }

  private selectPermissions$(resource: AttributesResource): Observable<AllowedPermissions> {
    if (this.resourceType === AttributesResourceType.Collection) {
      return this.store$.pipe(select(selectCollectionPermissions(resource.id)));
    }
    return this.store$.pipe(select(selectLinkTypePermissions(resource.id)));
  }

  public onSubmit() {
    const dataResource = this.currentDataResource || this.dataResource;
    if (this.createDirectly) {
      this.performingAction$.next(true);

      if (this.resourceType === AttributesResourceType.Collection) {
        this.createDocument(<DocumentModel>dataResource);
      } else {
        this.createLink(<LinkInstance>dataResource);
      }
    } else {
      this.onSubmit$.next(dataResource);
      this.hideDialog();
    }
  }

  private createDocument(document: DocumentModel) {
    this.store$.dispatch(
      new DocumentsAction.Create({
        document,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private createLink(linkInstance: LinkInstance) {
    this.store$.dispatch(
      new LinkInstancesAction.Create({
        linkInstance,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public onClose() {
    this.onCancel$.next();
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    // when another dialog is presented in top of this dialog, we don't want to listen on escape events
    if (
      event.code === KeyCode.Escape &&
      !this.performingAction$.getValue() &&
      this.initialModalsCount >= this.bsModalService.getModalsCount()
    ) {
      this.onClose();
    }
  }

  public onDataResourceChanged(dataResource: DataResource) {
    this.dataResourceChanged.emit(dataResource);
    this.currentDataResource = dataResource;
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    this.setData(data.collection, data.document);
  }
}
