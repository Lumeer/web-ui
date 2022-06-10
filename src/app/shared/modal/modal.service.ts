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

import {Injectable, TemplateRef} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {NavigationExtras} from '@angular/router';

import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {AttributeTypeModalComponent} from './attribute/type/attribute-type-modal.component';
import {AppState} from '../../core/store/app.state';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {first, map, mergeMap, take} from 'rxjs/operators';
import {combineLatest, interval, Observable} from 'rxjs';
import {Organization} from '../../core/store/organizations/organization';
import {AttributeFunctionModalComponent} from './attribute/function/attribute-function-modal.component';
import {selectAllCollections, selectCollectionById} from '../../core/store/collections/collections.state';
import {selectLinkTypeById} from '../../core/store/link-types/link-types.state';
import {LinkType} from '../../core/store/link-types/link.type';
import {CreateLinkModalComponent} from './create-link/create-link-modal.component';
import {ResourceAttributeSettings, View} from '../../core/store/views/view';
import {ShareViewModalComponent} from './view-modal/share/share-view-modal.component';
import {AttributesResource, AttributesResourceType, DataResource} from '../../core/model/resource';
import {DataResourceDetailModalComponent} from './data-resource-detail/data-resource-detail-modal.component';
import {ChooseLinkDocumentModalComponent} from './choose-link-document/choose-link-document-modal.component';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {GettingStartedModalComponent} from './getting-started/getting-started-modal.component';
import {ModalsAction} from '../../core/store/modals/modals.action';
import {attributeHasAnyFunction, attributeHasFunction} from '../utils/attribute.utils';
import {findAttribute} from '../../core/store/collections/collection.util';
import {AttributeDescriptionModalComponent} from './attribute/description/attribute-description-modal.component';
import {ModifyDocumentLinksModalComponent} from './modify-document-links/modify-document-links-modal.component';
import {ViewSettingsModalComponent} from './view-modal/settings/view-settings-modal.component';
import {Workspace} from '../../core/store/navigation/workspace';
import {DataResourcesDetailModalComponent} from './data-resources-detail/data-resources-detail-modal.component';
import {TabsSettingsModalComponent} from './tabs-settings/tabs-settings-modal.component';
import {AttributeLockModalComponent} from './attribute/lock/attribute-lock-modal.component';
import {AttributeLock} from '@lumeer/data-filters';
import {GettingStartedModalType} from './getting-started/model/getting-started-modal-type';
import {GetInTouchModalComponent} from './get-in-touch/get-in-touch-modal.component';
import {BookProductDemoModalComponent} from './book-product-demo/book-product-demo-modal.component';
import {DataResourceDetailLoadingModalComponent} from './data-resource-detail-loading/data-resource-detail-loading-modal.component';
import {ChooseLinkDocumentsModalComponent} from './choose-link-documents/choose-link-documents-modal.component';
import {DataResourcesChain} from './data-resource-detail/model/data-resources-chain';
import {QueryStem} from '../../core/store/navigation/query/query';
import {ChooseResourceModalComponent} from './choose-resource/choose-resource-modal.component';
import {ChooseStemModalComponent} from './choose-stem/choose-stem-modal.component';
import {LimitsService} from '../../core/service/limits.service';

type Options = ModalOptions & {initialState: any};

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(
    private store$: Store<AppState>,
    private bsModalService: BsModalService,
    private limitsService: LimitsService
  ) {}

  public show(content: string | TemplateRef<any> | any, config?: Options): BsModalRef {
    return this.addModalRef(this.bsModalService.show(content, config));
  }

  public isSomeModalOpened(): boolean {
    return this.bsModalService.getModalsCount() > 0;
  }

  public isSomeModalOpened$(): Observable<boolean> {
    return interval(1000).pipe(map(() => this.isSomeModalOpened()));
  }

  public showChooseCollection(
    collectionIds: string[],
    title?: string,
    callback?: (collectionId: string) => void,
    cancel?: () => void
  ): BsModalRef {
    const initialState = {
      resourceIds: collectionIds,
      resourceType: AttributesResourceType.Collection,
      title,
      callback,
      cancel,
    };
    return this.showStaticDialog(initialState, ChooseResourceModalComponent);
  }

  public showChooseStem(
    stems: QueryStem[],
    title?: string,
    callback?: (index: number) => void,
    cancel?: () => void
  ): BsModalRef {
    const initialState = {
      stems,
      title,
      callback,
      cancel,
    };
    return this.showStaticDialog(initialState, ChooseStemModalComponent);
  }

  public showChooseLinkDocument(
    documentIds: string[],
    viewId: string,
    callback?: (document: DocumentModel) => void
  ): BsModalRef {
    const config = {initialState: {documentIds, viewId, callback}, keyboard: true, class: 'modal-lg'};
    return this.show(ChooseLinkDocumentModalComponent, config);
  }

  public showChooseDocumentsPath(
    stems: QueryStem[],
    viewId: string,
    callback?: (document: DocumentModel[]) => void,
    cancel?: () => void
  ): BsModalRef {
    const initialState = {stems, viewId, callback, cancel};
    return this.showStaticDialog(initialState, ChooseLinkDocumentsModalComponent, 'modal-lg');
  }

  public showModifyDocumentLinks(
    documentId: string,
    collectionId: string,
    linkTypeId: string,
    workspace: Workspace,
    collectionAttributesSettings: ResourceAttributeSettings[],
    linkTypesAttributesSettings: Record<string, ResourceAttributeSettings[]>
  ): BsModalRef {
    return this.showStaticDialog(
      {
        documentId,
        collectionId,
        linkTypeIds: [linkTypeId],
        workspace,
        collectionAttributesSettings,
        linkTypesAttributesSettings,
      },
      ModifyDocumentLinksModalComponent,
      'modal-xxl'
    );
  }

  public showDocumentDetail(id: string, collectionId: string, viewId?: string): BsModalRef {
    const config = {
      initialState: {
        dataResourceId: id,
        resourceId: collectionId,
        resourceType: AttributesResourceType.Collection,
        viewId,
      },
      keyboard: true,
      class: 'modal-lg',
    };
    return this.show(DataResourceDetailLoadingModalComponent, config);
  }

  public showLinkInstanceDetail(id: string, linkTypeId: string, viewId?: string) {
    this.store$
      .pipe(
        select(selectLinkInstanceById(id)),
        mergeMap(linkInstance =>
          this.store$.pipe(
            select(selectLinkTypeById(linkInstance?.linkTypeId)),
            map(linkType => ({linkType, linkInstance: linkInstance}))
          )
        ),
        take(1)
      )
      .subscribe(({linkType, linkInstance}) => {
        if (linkInstance && linkType) {
          this.showDataResourceDetail(linkInstance, linkType, viewId);
        }
      });
  }

  public showDataResourceDetailWithChain(
    dataResource: DataResource,
    resource: AttributesResource,
    chain: DataResourcesChain,
    viewId?: string,
    onCreated?: (DataResource) => void,
    onCancel?: () => void
  ): BsModalRef {
    const initialState = {dataResource, resource, chain, viewId, onCreated, onCancel};
    const classString = 'modal-lg';
    if (dataResource?.id) {
      const config = {initialState, keyboard: true, class: classString};
      return this.show(DataResourceDetailModalComponent, config);
    } else {
      return this.showStaticDialog(initialState, DataResourceDetailModalComponent, classString);
    }
  }

  public showDataResourceDetail(
    dataResource: DataResource,
    resource: AttributesResource,
    viewId?: string,
    onCreated?: (DataResource) => void,
    onCancel?: () => void
  ): BsModalRef {
    const initialState = {dataResource, resource, viewId, onCreated, onCancel};
    const classString = 'modal-lg';
    if (dataResource?.id) {
      const config = {initialState, keyboard: true, class: classString};
      return this.show(DataResourceDetailModalComponent, config);
    } else {
      return this.showStaticDialog(initialState, DataResourceDetailModalComponent, classString);
    }
  }

  public showDataResourcesDetail(dataResources: DataResource[], title: string, viewId: string): BsModalRef {
    const config = {
      initialState: {dataResources, title, viewId},
      keyboard: true,
      class: 'modal-lg modal-h-100',
    };
    return this.show(DataResourcesDetailModalComponent, config);
  }

  public showShareView(view: View): BsModalRef {
    const initialState = {view};
    return this.showStaticDialog(initialState, ShareViewModalComponent, 'modal-xxl');
  }

  public showTabsSettings(perspectiveId: string, initialTab: string): BsModalRef {
    const initialState = {perspectiveId, initialTab};
    return this.showStaticDialog(initialState, TabsSettingsModalComponent, 'modal-lg');
  }

  public showViewSettings(view: View) {
    this.store$.pipe(select(selectAllCollections), take(1)).subscribe(collections => {
      const initialState = {view, collections};
      this.showStaticDialog(initialState, ViewSettingsModalComponent);
    });
  }

  public showCreateLink(
    collectionIds: string[],
    workspace?: Workspace,
    callback?: (linkType: LinkType) => void
  ): BsModalRef {
    const initialState = {collectionIds, workspace, callback};
    return this.showStaticDialog(initialState, CreateLinkModalComponent);
  }

  public showAttributeType(
    attributeId: string,
    collectionId: string,
    linkTypeId?: string,
    workspace?: Workspace
  ): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId, workspace};
    return this.showStaticDialog(initialState, AttributeTypeModalComponent);
  }

  public showAttributeLock(
    attributeId: string,
    collectionId: string,
    linkTypeId?: string,
    handleSubmit = false,
    overrideLock?: AttributeLock,
    workspace?: Workspace
  ): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId, workspace, overrideLock, handleSubmit};
    return this.showStaticDialog(initialState, AttributeLockModalComponent, 'modal-lg');
  }

  public showStaticDialog(
    initialState: any,
    content: string | TemplateRef<any> | any,
    classString: string = ''
  ): BsModalRef {
    const config = {initialState, keyboard: false, class: classString};
    config['backdrop'] = 'static';
    return this.show(content, config);
  }

  private addModalRef(modalRef: BsModalRef): BsModalRef {
    this.store$.dispatch(new ModalsAction.Add({modalId: modalRef.id}));
    return modalRef;
  }

  public showAttributeDescription(
    attributeId: string,
    collectionId: string,
    linkTypeId?: string,
    workspace?: Workspace
  ): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId, workspace};
    return this.showStaticDialog(initialState, AttributeDescriptionModalComponent);
  }

  public showAttributeFunction(attributeId: string, collectionId: string, linkTypeId?: string, workspace?: Workspace) {
    const attributesResourceObservable =
      (collectionId && this.store$.pipe(select(selectCollectionById(collectionId)))) ||
      this.store$.pipe(select(selectLinkTypeById(linkTypeId)));

    combineLatest([this.store$.pipe(select(selectServiceLimitsByWorkspace)), attributesResourceObservable])
      .pipe(first())
      .subscribe(([limits, attributesResource]) => {
        const functions = (attributesResource.attributes || []).filter(attr => attributeHasFunction(attr)).length;
        const hasAnyFunction = attributeHasAnyFunction(
          findAttribute(attributesResource?.attributes, attributeId),
          attributesResource?.rules
        );
        if (!hasAnyFunction && limits?.functionsPerCollection !== -1 && functions >= limits?.functionsPerCollection) {
          this.limitsService.notifyFunctionsLimit();
        } else {
          this.showAttributeFunctionDialog(attributeId, collectionId, linkTypeId, workspace);
        }
      });
  }

  private showAttributeFunctionDialog(
    attributeId: string,
    collectionId: string,
    linkTypeId: string,
    workspace?: Workspace
  ): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId, workspace};
    const config = {initialState, keyboard: false, class: 'modal-xxl'};
    config['backdrop'] = 'static';
    return this.show(AttributeFunctionModalComponent, config);
  }

  public showCreateProjectDialog(
    writableOrganizations: Organization[],
    selectedOrganization: Organization,
    templateCode?: string,
    extras?: NavigationExtras
  ): BsModalRef {
    this.store$.dispatch(new ProjectsAction.GetTemplates());
    const initialState = {
      type: GettingStartedModalType.Template,
      writableOrganizations,
      templateCode,
      selectedOrganization,
      navigationExtras: extras,
    };
    return this.showStaticDialog(initialState, GettingStartedModalComponent, 'modal-xxl modal-h-100');
  }

  public showCopyProjectDialog(
    writableOrganizations: Organization[],
    copyOrganizationId: string,
    copyProjectId: string,
    extras?: NavigationExtras
  ): BsModalRef {
    const initialState = {
      type: GettingStartedModalType.CopyProject,
      writableOrganizations,
      copyOrganizationId,
      copyProjectId,
      navigationExtras: extras,
    };
    return this.showStaticDialog(initialState, GettingStartedModalComponent, 'modal-lg');
  }

  public showEmailVerificationDialog(): BsModalRef {
    const initialState = {
      type: GettingStartedModalType.EmailVerification,
    };
    return this.showStaticDialog(initialState, GettingStartedModalComponent, '');
  }

  public showOnboardingVideoDialog(): BsModalRef {
    const initialState = {
      type: GettingStartedModalType.Video,
    };
    return this.showStaticDialog(initialState, GettingStartedModalComponent, 'modal-lg');
  }

  public showGetInTouchDialog(): BsModalRef {
    return this.showStaticDialog({}, GetInTouchModalComponent, '');
  }

  public showBookProductDemoDialog(): BsModalRef {
    return this.showStaticDialog({}, BookProductDemoModalComponent, '');
  }
}
