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
} from '@angular/core';
import {FormConfig, FormMode, FormSection} from '../../../../../core/store/form/form-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {AppState} from '../../../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable, of, Subscription, switchMap} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {DocumentModel, DocumentAdditionalDataRequest} from '../../../../../core/store/documents/document.model';
import {DataResourceData} from '../../../../../core/model/resource';
import {distinctUntilChanged, map, take, tap} from 'rxjs/operators';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributesSettings, View} from '../../../../../core/store/views/view';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {createDocumentRequestAdditionalData} from '../../../../../core/store/documents/document.utils';
import {FormValidationService} from './validation/form-validation.service';
import {FormValidation} from './validation/form-validation';
import {FormLinkData, FormLinkSelectedData} from './model/form-link-data';
import {collectLinkConfigsFromFormConfig, collectLinkIdsFromFormConfig} from '../../form-utils';
import {filter} from 'rxjs';
import {getOtherLinkedCollectionId} from '../../../../../shared/utils/link-type.utils';
import {selectCollectionsByIds} from '../../../../../core/store/collections/collections.state';
import {selectLinkInstancesByTypesAndDocuments} from '../../../../../core/store/link-instances/link-instances.state';
import {getOtherLinkedDocumentId} from '../../../../../core/store/link-instances/link.instance';
import {AllowedPermissions, ResourcesPermissions} from '../../../../../core/model/allowed-permissions';
import {User} from '../../../../../core/store/users/user';
import {selectCurrentUserForWorkspace} from '../../../../../core/store/users/users.state';
import {objectChanged} from '../../../../../shared/utils/common.utils';
import {filterVisibleAttributesBySettings} from '../../../../../shared/utils/attribute.utils';
import {uniqueValues} from '../../../../../shared/utils/array.utils';
import {generateCorrelationId} from '../../../../../shared/utils/resource.utils';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {CommonAction} from '../../../../../core/store/common/common.action';
import {FormStateService} from './service/form-state.service';
import {FormCoordinates} from './model/form-coordinates';
import {DataInputSaveAction} from '../../../../../shared/data-input/data-input-save-action';

@Component({
  selector: 'form-view',
  templateUrl: './form-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormValidationService, FormStateService],
})
export class FormViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public resourcesPermissions: ResourcesPermissions;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public readonly modeType = FormMode;

  public documentDataValues$: Observable<Record<string, DataValue>>;
  public document$: Observable<DocumentModel>;
  public originalDocument$: Observable<DocumentModel>;
  public validation$: Observable<FormValidation>;
  public linkData$: Observable<Record<string, FormLinkData>>;
  public currentUser$: Observable<User>;
  public constraintData$: Observable<ConstraintData>;
  public editedCell$: Observable<FormCoordinates>;

  public view$ = new BehaviorSubject<View>(null);
  public config$ = new BehaviorSubject<FormConfig>(null);
  public collection$ = new BehaviorSubject<Collection>(null);
  public linkTypes$ = new BehaviorSubject<LinkType[]>([]);
  public selectedDocumentIds$ = new BehaviorSubject<{id?: string; correlationId?: string}>({});
  public data$ = new BehaviorSubject<DataResourceData>({});
  public dataValues$ = new BehaviorSubject<Record<string, DataValue>>({});
  public selectedLinkData$ = new BehaviorSubject<Record<string, FormLinkSelectedData>>({});
  public performingAction$ = new BehaviorSubject(false);
  public performingDelete$ = new BehaviorSubject(false);

  public collectionPermissions: AllowedPermissions;

  private subscriptions = new Subscription();

  constructor(
    private store$: Store<AppState>,
    private formValidation: FormValidationService,
    private formState: FormStateService
  ) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
    this.validation$ = this.formValidation.validation$;
    this.editedCell$ = this.formState.editedCell$;

    this.subscribeIds();
    this.observeDocument();
    this.observeDataValues();
    this.observeFormLinkData();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourcesPermissions || objectChanged(changes.collection)) {
      this.collectionPermissions = this.resourcesPermissions?.collections?.[this.collection?.id];
    }
    if (changes.collection || changes.attributesSettings) {
      const attributes = filterVisibleAttributesBySettings(this.collection, this.attributesSettings?.collections);
      const updatedCollection = {...this.collection, attributes};
      this.collection$.next(updatedCollection);
      this.formValidation.setCollection(updatedCollection);
      this.formState.setCollection(updatedCollection);
    }
    if (changes.config) {
      this.config$.next(this.config);
      this.formValidation.setConfig(this.config);
      this.formState.setConfig(this.config);
    }
    if (changes.view) {
      this.view$.next(this.view);
    }
    if (changes.collectionLinkTypes) {
      this.linkTypes$.next(this.collectionLinkTypes || []);
    }
  }

  private subscribeIds() {
    this.subscriptions.add(this.selectedDocumentIds$.subscribe(ids => this.formValidation.setDocumentId(ids?.id)));
  }

  private observeDocument() {
    const collectionId$ = this.collection$.pipe(
      map(collection => collection.id),
      distinctUntilChanged()
    );
    this.document$ = combineLatest([this.selectedDocumentIds$, this.data$, collectionId$]).pipe(
      switchMap(([ids, data, collectionId]) => {
        if (ids?.correlationId) {
          return of({id: null, correlationId: ids.correlationId, data, collectionId});
        }
        if (ids?.id) {
          return this.store$.pipe(
            select(selectDocumentById(ids.id)),
            map(document => {
              if (document) {
                return {...document, data: mergeMapData(document.data, data)};
              }
              return null;
            })
          );
        }

        return of(null);
      })
    );
    this.originalDocument$ = this.selectedDocumentIds$.pipe(
      switchMap(ids => {
        if (ids?.id) {
          return this.store$.pipe(select(selectDocumentById(ids.id)));
        }
        return of(null);
      })
    );
  }

  private observeDataValues() {
    const documentDataValues$ = combineLatest([this.constraintData$, this.collection$, this.document$]).pipe(
      map(([constraintData, collection, document]) =>
        (collection?.attributes || []).reduce<Record<string, DataValue>>(
          (dataValues, attribute) => ({
            ...dataValues,
            [attribute.id]: attribute?.constraint?.createDataValue(document?.data?.[attribute.id], constraintData),
          }),
          {}
        )
      )
    );

    this.documentDataValues$ = combineLatest([documentDataValues$, this.dataValues$]).pipe(
      tap(([documentDataValues, dataValues]) => this.formValidation.setDataValues(documentDataValues, dataValues)),
      map(([documentDataValues, dataValues]) => mergeMapData(documentDataValues, dataValues))
    );
  }

  private observeFormLinkData() {
    const collectionId$ = this.collection$.pipe(
      map(collection => collection?.id),
      filter(id => !!id),
      distinctUntilChanged()
    );
    const collections$ = combineLatest([this.config$, this.linkTypes$, collectionId$]).pipe(
      switchMap(([config, allLinkTypes, collectionId]) => {
        const linkTypeIds = collectLinkIdsFromFormConfig(config);
        const linkTypes = allLinkTypes.filter(linkType => linkTypeIds.includes(linkType.id));
        const otherCollectionIds = linkTypes
          .map(linkType => getOtherLinkedCollectionId(linkType, collectionId))
          .filter(id => !!id);
        return this.store$.pipe(select(selectCollectionsByIds(otherCollectionIds)));
      })
    );

    const linkInstances$ = combineLatest([this.config$, this.document$]).pipe(
      switchMap(([config, document]) => {
        if (document?.id) {
          const linkTypeIds = collectLinkIdsFromFormConfig(config);
          return this.store$.pipe(select(selectLinkInstancesByTypesAndDocuments(linkTypeIds, [document.id])));
        }
        return of([]);
      })
    );

    this.linkData$ = combineLatest([
      this.config$,
      this.linkTypes$,
      this.view$,
      this.selectedLinkData$,
      this.selectedDocumentIds$,
      linkInstances$,
      collectionId$,
      collections$,
    ]).pipe(
      map(([config, allLinkTypes, view, selectedLinkData, ids, allLinkInstances, collectionId, allCollections]) => {
        return collectLinkConfigsFromFormConfig(config).reduce<Record<string, FormLinkData>>((linkDataMap, config) => {
          const linkType = allLinkTypes.find(lt => lt.id === config.linkTypeId);
          if (linkType) {
            const otherCollectionId = getOtherLinkedCollectionId(linkType, collectionId);
            const otherCollection = allCollections.find(collection => collection.id === otherCollectionId);
            if (otherCollection) {
              const linkInstances = allLinkInstances.filter(linkInstance => linkInstance.linkTypeId === linkType.id);
              const linkDocumentIds = uniqueValues(
                linkInstances.map(linkInstance => getOtherLinkedDocumentId(linkInstance, ids?.id))
              );
              linkDataMap[linkType.id] = {
                view,
                linkType,
                collection: otherCollection,
                linkInstances,
                linkDocumentIds,
                ...selectedLinkData[linkType.id],
              };
            }
          }

          return linkDataMap;
        }, {});
      }),
      tap(linkData => {
        this.formValidation.setLinkData(linkData, this.selectedLinkData$.value);
        this.formState.setLinkData(linkData);
      })
    );
  }

  public onAttributeValueChange(
    data: {attributeId: string; dataValue: DataValue; rowId: string; cellId: string; action?: DataInputSaveAction},
    sectionId: string
  ) {
    this.formState.onValueSave({sectionId, rowId: data.rowId, cellId: data.cellId}, data.action);

    const serializedValue = data.dataValue.serialize();
    const newData = {...this.data$.value, [data.attributeId]: serializedValue};
    const newDataValues = {...this.dataValues$.value, [data.attributeId]: data.dataValue.copy(serializedValue)};

    this.data$.next(newData);
    this.dataValues$.next(newDataValues);
  }

  public onLinkValueChange(
    data: {
      linkTypeId: string;
      selectedData: FormLinkSelectedData;
      rowId: string;
      cellId: string;
      action?: DataInputSaveAction;
    },
    sectionId: string
  ) {
    this.formState.onValueSave({sectionId, rowId: data.rowId, cellId: data.cellId}, data.action);

    const newData = {...this.selectedLinkData$.value, [data.linkTypeId]: data.selectedData};

    this.selectedLinkData$.next(newData);
  }

  public onEditCancel(data: {rowId: string; cellId: string}, sectionId: string) {
    this.formState.onEditCancel({...data, sectionId});
  }

  public onEditStart(data: {rowId: string; cellId: string}, sectionId: string) {
    this.formState.onEditStart({...data, sectionId});
  }

  public trackBySection(index: number, section: FormSection): string {
    return section.id;
  }

  public onSubmit() {
    this.document$.pipe(take(1)).subscribe(document => this.submit(document));
  }

  private submit(document: DocumentModel) {
    this.performingAction$.next(true);

    const additionalData = createDocumentRequestAdditionalData(
      this.collection$.value,
      this.dataValues$.value,
      this.filterSelectedLinkData(this.selectedLinkData$.value)
    );
    const updatedDocument = this.checkDocumentData(document);
    if (document.id) {
      this.updateDocument(updatedDocument, additionalData);
    } else {
      this.createDocument(updatedDocument, additionalData);
    }
  }

  private checkDocumentData(document: DocumentModel): DocumentModel {
    // attributes can be deleted or hidden when user is filling the form
    const data = {...document.data};
    const currentAttributesIds = (this.collection$.value?.attributes || []).map(attribute => attribute.id);
    for (const attributeId of Object.keys(data)) {
      if (!currentAttributesIds.includes(attributeId)) {
        delete data[attributeId];
      }
    }

    return {...document, data};
  }

  private filterSelectedLinkData(data: Record<string, FormLinkSelectedData>): Record<string, FormLinkSelectedData> {
    // link types can be deleted when user is filling the form
    const linkTypeIds = (this.linkTypes$.value || []).map(linkType => linkType.id);
    return Object.keys(data).reduce((resultData, linkTypeId) => {
      if (linkTypeIds.includes(linkTypeId)) {
        resultData[linkTypeId] = data[linkTypeId];
      }

      return resultData;
    }, {});
  }

  private createDocument(document: DocumentModel, data: DocumentAdditionalDataRequest) {
    this.store$.dispatch(
      new DocumentsAction.CreateWithAdditionalData({
        document,
        data,
        workspace: {viewId: this.view?.id},
        onSuccess: documentId => {
          this.clearData();
          this.selectedDocumentIds$.next({id: documentId});
          this.performingAction$.next(false);
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private updateDocument(document: DocumentModel, data: DocumentAdditionalDataRequest) {
    this.store$.dispatch(
      new DocumentsAction.UpdateWithAdditionalData({
        document,
        data,
        workspace: {viewId: this.view?.id},
        onSuccess: () => {
          this.clearData();
          this.performingAction$.next(false);
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public clearData() {
    this.data$.next({});
    this.dataValues$.next({});
    this.selectedLinkData$.next({});
  }

  public onSelectDocument(document: DocumentModel) {
    const selectedId = this.selectedDocumentIds$.value.id || this.selectedDocumentIds$.value.correlationId;
    const documentId = document?.id || document?.correlationId;

    if (selectedId !== documentId) {
      if (this.userEnteredData()) {
        const title = $localize`:@@perspective.form.view.submit.warning.data.title:Unconfirmed changes`;
        const message = $localize`:@@perspective.form.view.submit.warning.data.message:There are some changes in form that was not saved. Are you sure to select document?`;
        const yesTitle = $localize`:@@perspective.form.view.submit.warning.data.yes:Select`;
        const noTitle = $localize`:@@perspective.form.view.submit.warning.data.no:Do nothing`;
        this.store$.dispatch(
          new NotificationsAction.Confirm({
            title,
            message,
            yesTitle,
            noTitle,
            action: new CommonAction.ExecuteCallback({callback: () => this.selectDocument(document)}),
            type: 'warning',
          })
        );
      } else {
        this.selectDocument(document);
      }
    }
  }

  private selectDocument(document: DocumentModel) {
    if (document?.id) {
      this.selectedDocumentIds$.next({id: document.id});
    } else if (document?.correlationId) {
      this.selectedDocumentIds$.next({correlationId: document.correlationId});
    } else {
      this.selectedDocumentIds$.next({});
    }
    this.clearData();
  }

  private userEnteredData(): boolean {
    return Object.keys(this.dataValues$.value).length > 0 || Object.keys(this.selectedLinkData$.value).length > 0;
  }

  public onAddNewDocument() {
    const correlationId = generateCorrelationId();
    this.selectedDocumentIds$.next({correlationId});
    this.clearData();
  }

  public onDelete() {
    const {id} = this.selectedDocumentIds$.value;
    if (id) {
      this.performingDelete$.next(true);

      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: this.collection.id,
          documentId: id,
          onSuccess: () => {
            this.clearData();
            this.performingDelete$.next(false);
          },
          onFailure: () => this.performingDelete$.next(false),
          onCancel: () => this.performingDelete$.next(false),
          workspace: {viewId: this.view?.id},
        })
      );
    } else {
      this.selectedDocumentIds$.next({});
      this.clearData();
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

function mergeMapData(data: Record<string, any>, overrideData: Record<string, any>): Record<string, any> {
  const copy = {...data};
  Object.keys(overrideData).forEach(key => (copy[key] = overrideData[key]));
  return copy;
}
