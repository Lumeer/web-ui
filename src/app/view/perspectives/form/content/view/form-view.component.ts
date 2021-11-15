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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormConfig, FormSection} from '../../../../../core/store/form/form-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {DataValue} from '@lumeer/data-filters';
import {AppState} from '../../../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable, of, switchMap} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {DocumentModel, DocumentAdditionalDataRequest} from '../../../../../core/store/documents/document.model';
import {DataResourceData} from '../../../../../core/model/resource';
import {distinctUntilChanged, map, take, tap} from 'rxjs/operators';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributesSettings, View} from '../../../../../core/store/views/view';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {FormMode} from '../mode/form-mode';
import {createDocumentRequestAdditionalData} from '../../../../../core/store/documents/document.utils';
import {FormValidationService} from './validation/form-validation.service';
import {FormValidation} from './validation/form-validation';
import {FormLinkData} from './model/form-link-data';
import {collectLinkConfigsFromFormConfig, collectLinkIdsFromFormConfig} from '../../form-utils';
import {filter} from 'rxjs';
import {getOtherLinkedCollectionId} from '../../../../../shared/utils/link-type.utils';
import {selectCollectionsByIds} from '../../../../../core/store/collections/collections.state';

@Component({
  selector: 'form-view',
  templateUrl: './form-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormValidationService],
})
export class FormViewComponent implements OnInit, OnChanges {
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
  public mode: FormMode.Create | FormMode.Update;

  public readonly modeType = FormMode;

  public documentDataValues$: Observable<Record<string, DataValue>>;
  public document$: Observable<DocumentModel>;
  public validation$: Observable<FormValidation>;
  public linkData$: Observable<Record<string, FormLinkData>>;

  public view$ = new BehaviorSubject<View>(null);
  public config$ = new BehaviorSubject<FormConfig>(null);
  public collection$ = new BehaviorSubject<Collection>(null);
  public linkTypes$ = new BehaviorSubject<LinkType[]>([]);
  public selectedDocumentId$ = new BehaviorSubject<string>(null);
  public data$ = new BehaviorSubject<DataResourceData>({});
  public dataValues$ = new BehaviorSubject<Record<string, DataValue>>({});
  public performingAction$ = new BehaviorSubject(false);

  constructor(private store$: Store<AppState>, private formValidation: FormValidationService) {}

  public ngOnInit() {
    this.validation$ = this.formValidation.validation$;

    this.observeDocument();
    this.observeDataValues();
    this.observeFormLinkData();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.collection$.next(this.collection);
      this.formValidation.setCollection(this.collection);
    }
    if (changes.config) {
      this.config$.next(this.config);
      this.formValidation.setConfig(this.config);
    }
    if (changes.view) {
      this.view$.next(this.view);
    }
    if (changes.collectionLinkTypes) {
      this.linkTypes$.next(this.collectionLinkTypes || []);
    }
    if (changes.mode && this.mode !== changes.mode.previousValue) {
      this.clearData();
      this.formValidation.setMode(this.mode);
    }
  }

  private observeDocument() {
    const collectionId$ = this.collection$.pipe(
      map(collection => collection.id),
      distinctUntilChanged()
    );
    this.document$ = combineLatest([this.selectedDocumentId$, this.data$, collectionId$]).pipe(
      switchMap(([documentId, data, collectionId]) => {
        if (documentId) {
          return this.store$.pipe(
            select(selectDocumentById(documentId)),
            map(document => {
              if (document) {
                return {...document, data: mergeMapData(document.data, data)};
              }
              return {id: null, data, collectionId};
            })
          );
        }

        return of({id: null, data, collectionId});
      })
    );
  }

  private observeDataValues() {
    const documentDataValues$ = combineLatest([
      this.store$.pipe(select(selectConstraintData)),
      this.collection$,
      this.document$,
    ]).pipe(
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
    this.linkData$ = combineLatest([this.config$, this.linkTypes$, this.view$, collectionId$, collections$]).pipe(
      map(([config, allLinkTypes, view, collectionId, allCollections]) => {
        return collectLinkConfigsFromFormConfig(config).reduce<Record<string, FormLinkData>>((linkDataMap, config) => {
          const linkType = allLinkTypes.find(lt => lt.id === config.linkTypeId);
          if (linkType) {
            const otherCollectionId = getOtherLinkedCollectionId(linkType, collectionId);
            const otherCollection = allCollections.find(collection => collection.id === otherCollectionId);
            if (otherCollection) {
              linkDataMap[linkType.id] = {view, linkType, collection: otherCollection, selectedDocumentIds: []};
            }
          }

          return linkDataMap;
        }, {});
      })
    );
  }

  public onAttributeValueChange(data: {attributeId: string; dataValue: DataValue}) {
    const newData = {...this.data$.value, [data.attributeId]: data.dataValue.serialize()};
    const newDataValues = {...this.dataValues$.value, [data.attributeId]: data.dataValue};

    this.data$.next(newData);
    this.dataValues$.next(newDataValues);
  }

  public trackBySection(index: number, section: FormSection): string {
    return section.id;
  }

  public onSubmit() {
    this.document$.pipe(take(1)).subscribe(document => this.submit(document));
  }

  private submit(document: DocumentModel) {
    this.performingAction$.next(true);

    const additionalData = createDocumentRequestAdditionalData(this.collection, this.dataValues$.value);
    if (document.id) {
      this.updateDocument(document, additionalData);
    } else {
      this.createDocument(document, additionalData);
    }
  }

  private createDocument(document: DocumentModel, data: DocumentAdditionalDataRequest) {
    this.store$.dispatch(
      new DocumentsAction.CreateWithAdditionalData({
        document,
        data,
        onSuccess: () => {
          this.clearData();
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
  }

  public selectDocument(document: DocumentModel) {
    this.selectedDocumentId$.next(document.id);
  }
}

function mergeMapData(data: Record<string, any>, overrideData: Record<string, any>): Record<string, any> {
  const copy = {...data};
  Object.keys(overrideData).forEach(key => (copy[key] = overrideData[key]));
  return copy;
}
