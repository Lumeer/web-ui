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

import {Injectable} from '@angular/core';
import {Attribute} from '../../core/store/collections/collection';
import {BehaviorSubject, combineLatest, of, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {NotificationService} from '../../core/notifications/notification.service';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {generateCorrelationId, getAttributesResourceType} from '../utils/resource.utils';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {findAttribute, getDefaultAttributeId} from '../../core/store/collections/collection.util';
import {isNotNullOrUndefined} from '../utils/common.utils';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {deepArrayEquals} from '../utils/array.utils';
import {findAttributeByName} from '../utils/attribute.utils';
import {AttributesResource, AttributesResourceType, DataResource, DataResourceData} from '../../core/model/resource';
import {selectLinkTypeById} from '../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {ResourceAttributeSettings} from '../../core/store/views/view';
import {createAttributesSettingsOrder} from '../settings/settings.util';

export interface DataRow {
  id: string;
  attribute?: Attribute;
  key?: string;
  value: any;
  isDefault?: boolean;
  creating?: boolean;
}

@Injectable()
export class DataRowService {
  public rows$ = new BehaviorSubject<DataRow[]>([]);

  private resourceType: AttributesResourceType;
  private resource: AttributesResource;
  private dataResource: DataResource;
  private settingsOrder: ResourceAttributeSettings[];

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private notificationService: NotificationService) {}

  public get isCollectionResource(): boolean {
    return this.resourceType === AttributesResourceType.Collection;
  }

  public get isNewDataResource(): boolean {
    return !this.dataResource.id;
  }

  public init(resource: AttributesResource, dataResource: DataResource, settingsOrder?: ResourceAttributeSettings[]) {
    this.resource = resource;
    this.resourceType = getAttributesResourceType(resource);
    this.dataResource = dataResource;
    this.settingsOrder = settingsOrder;
    this.emitRows(this.createDataRows());
    this.refreshSubscription();
  }

  public setSettings(settingsOrder: ResourceAttributeSettings[]) {
    this.settingsOrder = settingsOrder;
    this.emitRows(this.createDataRows());
  }

  private emitRows(rows: DataRow[]) {
    if (!deepArrayEquals(rows, this.rows$.value)) {
      this.rows$.next(rows);
    }
  }

  private refreshSubscription() {
    this.destroy();
    this.subscriptions = new Subscription();
    if (this.isCollectionResource) {
      this.subscribeCollectionAndDocument();
    } else {
      this.subscribeLinkTypeAndLink();
    }
  }

  private subscribeCollectionAndDocument() {
    const documentObservable = !this.isNewDataResource
      ? this.store$.pipe(select(selectDocumentById(this.dataResource.id)))
      : of(this.dataResource);
    this.subscriptions.add(
      combineLatest([documentObservable, this.store$.pipe(select(selectCollectionById(this.resource.id)))]).subscribe(
        ([document, collection]) => {
          this.dataResource = document;
          this.resource = collection;
          this.refreshRows();
        }
      )
    );
  }

  private subscribeLinkTypeAndLink() {
    const linkInstanceObservable = !this.isNewDataResource
      ? this.store$.pipe(select(selectLinkInstanceById(this.dataResource.id)))
      : of(this.dataResource);
    this.subscriptions.add(
      combineLatest([linkInstanceObservable, this.store$.pipe(select(selectLinkTypeById(this.resource.id)))]).subscribe(
        ([document, collection]) => {
          this.dataResource = document;
          this.resource = collection;
          this.refreshRows();
        }
      )
    );
  }

  public createDataRows(): DataRow[] {
    const defaultAttributeId = this.isCollectionResource ? getDefaultAttributeId(this.resource) : null;
    const data = this.dataResource?.data || {};

    return createAttributesSettingsOrder(this.resource?.attributes, this.settingsOrder)
      .filter(setting => !setting.hidden)
      .map(setting => findAttribute(this.resource?.attributes, setting.attributeId))
      .map(attribute => this.createDataRow(attribute, data, defaultAttributeId));
  }

  private createDataRow(attribute: Attribute, data: DataResourceData, defaultAttributeId: string): DataRow {
    return {
      id: attribute.id,
      attribute,
      isDefault: attribute.id === defaultAttributeId,
      value: data[attribute.id],
    };
  }

  private refreshRows() {
    const rows = this.createDataRows();
    const rowNames = rows.map(row => row.attribute.name);

    for (let i = 0; i < this.rows$.value.length; i++) {
      const row = this.rows$.value[i];
      if (!row.attribute?.id && !rowNames.includes(row.key)) {
        if (i < rows.length) {
          rows.splice(i, 0, row);
        } else {
          rows.push(row);
        }
      }
    }

    if (!deepArrayEquals(rows, this.rows$.value)) {
      this.emitRows(rows);
    }
  }

  public addRow() {
    const newRow: DataRow = {id: generateCorrelationId(), key: '', value: ''};
    this.emitRows([...this.rows$.value, newRow]);
  }

  public deleteRow(index: number) {
    const row = this.rows$.value[index];
    if (row) {
      if (!this.isNewDataResource && row.attribute) {
        this.deleteExistingRow(row);
      } else {
        this.deleteNewRow(index);
      }
    }
  }

  private deleteExistingRow(row: DataRow) {
    const data = {...this.dataResource.data};
    delete data[row.attribute.id];
    let action;
    if (this.isCollectionResource) {
      action = new DocumentsAction.UpdateData({document: {...(<DocumentModel>this.dataResource), data}});
    } else {
      action = new LinkInstancesAction.UpdateData({linkInstance: {...(<LinkInstance>this.dataResource), data}});
    }

    const message = $localize`:@@dataResource.detail.attribute.remove.confirm:Are you sure you want to delete this row?`;
    const title = $localize`:@@resource.delete.dialog.title:Delete?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.store$.dispatch(action));
  }

  private deleteNewRow(index: number) {
    const rows = [...this.rows$.value];
    rows.splice(index, 1);
    this.emitRows(rows);
  }

  public updateRow(index: number, key?: string, value?: any) {
    const row = this.rows$.value[index];
    if (row) {
      if ((key || '').trim().length > 0) {
        this.updateAttribute(row, index, key.trim());
      } else if (isNotNullOrUndefined(value)) {
        this.updateValue(row, index, value);
      }
    }
  }

  private updateAttribute(row: DataRow, index: number, name: string) {
    const existingAttribute = findAttributeByName(this.resource?.attributes, name);
    if (existingAttribute) {
      this.updateExistingAttribute(row, index, existingAttribute);
    } else {
      this.updateNewAttribute(row, index, name);
    }
  }

  private updateExistingAttribute(row: DataRow, index: number, attribute: Attribute) {
    const usedKeys = Object.keys(this.dataResource?.data || {});
    if (!this.dataResource || usedKeys.includes(attribute.id)) {
      return; // attribute is already used in document
    }

    const rows = [...this.rows$.value];
    const defaultAttributeId = this.isCollectionResource ? getDefaultAttributeId(this.resource) : null;
    const newRow = {attribute, id: attribute.id, value: null, isDefault: attribute.id === defaultAttributeId};
    rows.splice(index, 1, newRow);
    this.emitRows(rows);

    if (!this.isNewDataResource) {
      rows.splice(index, 1);
      const data = {...this.dataResource.data};
      if (row.attribute) {
        delete data[row.attribute.id];
      }
      data[attribute.id] = isNotNullOrUndefined(row.value) ? row.value : '';
      const newDataResource = {...this.dataResource, data};
      if (this.isCollectionResource) {
        this.store$.dispatch(new DocumentsAction.UpdateData({document: <DocumentModel>newDataResource}));
      } else {
        this.store$.dispatch(new LinkInstancesAction.UpdateData({linkInstance: <LinkInstance>newDataResource}));
      }
    }
  }

  private updateNewAttribute(row: DataRow, index: number, name: string) {
    const value = isNotNullOrUndefined(row.value) ? row.value : '';
    const newAttribute = {name, constraint: row.attribute?.constraint};
    const rows = [...this.rows$.value];
    const newRow = {
      attribute: newAttribute,
      key: name,
      value,
      id: generateCorrelationId(),
      isDefault: false,
      creating: true,
    };
    rows.splice(index, 1, newRow);
    this.emitRows(rows);

    if (!this.isNewDataResource) {
      const newData = {[name]: {value}};
      const data = {...this.dataResource.data};
      if (row.attribute) {
        delete data[row.attribute.id];
      }
      const newDataResource = {...this.dataResource, newData, data};
      if (this.isCollectionResource) {
        this.store$.dispatch(
          new CollectionsAction.CreateAttributes({
            collectionId: (<DocumentModel>this.dataResource).collectionId,
            attributes: [newAttribute],
            nextAction: new DocumentsAction.UpdateData({document: <DocumentModel>newDataResource}),
          })
        );
      } else {
        this.store$.dispatch(
          new LinkTypesAction.CreateAttributes({
            linkTypeId: (<LinkInstance>this.dataResource).linkTypeId,
            attributes: [newAttribute],
            nextAction: new LinkInstancesAction.UpdateData({linkInstance: <LinkInstance>newDataResource}),
          })
        );
      }
    }
  }

  private updateValue(row: DataRow, index: number, value: any) {
    this.updateNewValue(row, index, value);
    if (!this.isNewDataResource && row.attribute) {
      this.updateExistingValue(row, value);
    }
  }

  private updateExistingValue(row: DataRow, value: any) {
    const patchData = {[row.attribute.id]: value};
    const dataResource = {...this.dataResource, data: patchData};
    if (this.isCollectionResource) {
      this.store$.dispatch(new DocumentsAction.PatchData({document: <DocumentModel>dataResource}));
    } else {
      this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance: <LinkInstance>dataResource}));
    }
  }

  private updateNewValue(row: DataRow, index: number, value: any) {
    const newRow = {...row, value};
    const rows = [...this.rows$.value];
    rows[index] = newRow;
    this.emitRows(rows);
  }

  public destroy() {
    this.subscriptions.unsubscribe();
  }
}
