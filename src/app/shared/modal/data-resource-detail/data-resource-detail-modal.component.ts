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
import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit, TemplateRef} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subscription, combineLatest, of} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';

import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectAllCollections, selectCollectionById} from '../../../core/store/collections/collections.state';
import {
  createFlatCollectionSettingsQueryStem,
  createFlatLinkTypeSettingsQueryStem,
  createFlatResourcesSettingsQuery,
} from '../../../core/store/details/detail.utils';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectAllLinkTypes, selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {Workspace} from '../../../core/store/navigation/workspace';
import {View} from '../../../core/store/views/view';
import {selectDefaultDocumentView, selectViewById, selectViewQuery} from '../../../core/store/views/views.state';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {DialogType} from '../dialog-type';
import {DataResourcesChain} from './model/data-resources-chain';

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
  public viewId: string;

  @Input()
  public chain: DataResourcesChain;

  @Input()
  public onCreated: (dataResource: DataResource) => void;

  @Input()
  public onCancel?: () => void;

  public readonly dialogType = DialogType;
  public readonly collectionResourceType = AttributesResourceType.Collection;

  public resourceType: AttributesResourceType;

  public performingAction$ = new BehaviorSubject(false);

  public query$: Observable<Query>;
  public settingsQuery$: Observable<Query>;
  public resource$: Observable<AttributesResource>;
  public dataResource$ = new BehaviorSubject<DataResource>(null);
  public currentView$: Observable<View>;

  public detailSettingsQueryStem: QueryStem;

  private dataResourceSubscription = new Subscription();
  private dataExistSubscription = new Subscription();
  private initialModalsCount: number;
  private currentView: View;

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
    this.subscribeDataResource(dataResource);

    if (this.viewId) {
      this.currentView$ = this.store$.pipe(select(selectViewById(this.viewId)));
    }

    if (this.resourceType === AttributesResourceType.Collection) {
      if (!this.viewId) {
        this.currentView$ = this.resource$.pipe(
          switchMap(resource => this.store$.pipe(select(selectDefaultDocumentView((<Collection>resource)?.purpose))))
        );
      }
      this.detailSettingsQueryStem = createFlatCollectionSettingsQueryStem(resource);
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      if (!this.viewId) {
        this.currentView$ = of(null);
      }
      this.detailSettingsQueryStem = createFlatLinkTypeSettingsQueryStem(<LinkType>resource);
    }
    this.currentView$ = this.currentView$.pipe(tap(view => (this.currentView = view)));

    this.subscribeExist(resource, dataResource);
  }

  private subscribeDataResource(dataResource: DataResource) {
    if (dataResource?.id) {
      this.dataResourceSubscription.unsubscribe();
      this.dataResourceSubscription = this.selectDataResource$(dataResource.id).subscribe(dataResource =>
        this.dataResource$.next(dataResource)
      );
    } else {
      this.dataResource$.next(dataResource);
    }
  }

  private subscribeExist(resource: AttributesResource, dataResource: DataResource) {
    this.dataExistSubscription.unsubscribe();
    this.dataExistSubscription = combineLatest([
      resource?.id ? this.selectResource$(resource.id) : of(true),
      dataResource?.id ? this.selectDataResource$(dataResource.id) : of(true),
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

  public onSubmit(dataResource: DataResource) {
    if (dataResource?.id) {
      this.onClose();
    } else {
      this.createDataResource(dataResource, true);
    }
  }

  public onDataResourceChanged(dataResource: DataResource) {
    if (!dataResource.id) {
      this.createDataResource(dataResource);
    }
  }

  private createDataResource(dataResource: DataResource, closeAfter?: boolean) {
    if (this.chain) {
      this.createChain(dataResource, closeAfter);
    } else if (this.resourceType === AttributesResourceType.Collection) {
      this.createDocument(<DocumentModel>dataResource, closeAfter);
    } else {
      this.createLink(<LinkInstance>dataResource, closeAfter);
    }
  }

  private createChain(dataResource: DataResource, closeAfter: boolean) {
    this.performingAction$.next(true);

    let resourceId: string;
    if (this.chain.type === AttributesResourceType.Collection) {
      this.chain.documents[this.chain.index].data = dataResource.data;
      resourceId = this.chain.documents[this.chain.index].collectionId;
    } else {
      this.chain.linkInstances[this.chain.index].data = dataResource.data;
      resourceId = this.chain.linkInstances[this.chain.index].linkTypeId;
    }

    this.store$.dispatch(
      new DocumentsAction.CreateChain({
        ...this.chain,
        workspace: this.currentWorkspace(),
        afterSuccess: ({documents, linkInstances}) => {
          if (this.chain.type === AttributesResourceType.Collection) {
            const document = documents.find(document => document.collectionId === resourceId);
            if (document) {
              this.onCreated?.(document);
              this.subscribeDataResource(document);
            }
          } else {
            const linkInstance = linkInstances.find(linkInstance => linkInstance.linkTypeId === resourceId);
            if (linkInstance) {
              this.onCreated?.(linkInstance);
              this.subscribeDataResource(linkInstance);
            }
          }
          if (closeAfter) {
            this.hideDialog();
          } else {
            this.performingAction$.next(false);
          }
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private createDocument(document: DocumentModel, closeAfter: boolean) {
    this.performingAction$.next(true);

    this.store$.dispatch(
      new DocumentsAction.Create({
        document,
        workspace: this.currentWorkspace(),
        afterSuccess: document => {
          this.onCreated?.(document);
          this.subscribeDataResource(document);
          if (closeAfter) {
            this.hideDialog();
          } else {
            this.performingAction$.next(false);
          }
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private createLink(linkInstance: LinkInstance, closeAfter: boolean) {
    this.performingAction$.next(true);

    this.store$.dispatch(
      new LinkInstancesAction.Create({
        linkInstance,
        workspace: this.currentWorkspace(),
        afterSuccess: linkInstance => {
          this.onCreated?.(linkInstance);
          this.subscribeDataResource(linkInstance);
          if (closeAfter) {
            this.hideDialog();
          } else {
            this.performingAction$.next(false);
          }
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private currentWorkspace(): Workspace {
    return {viewId: this.currentView?.id};
  }

  public onClose() {
    this.onCancel?.();
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    // when another dialog is presented in top of this dialog, we don't want to listen on escape events
    if (
      keyboardEventCode(event) === KeyCode.Escape &&
      !this.performingAction$.getValue() &&
      this.initialModalsCount >= this.bsModalService.getModalsCount()
    ) {
      this.onClose();
    }
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    this.setData(data.collection, data.document);
  }
}
