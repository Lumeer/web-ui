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
import {AppState} from '../store/app.state';
import {select, Store} from '@ngrx/store';
import {combineLatest} from 'rxjs';
import {selectDocumentById} from '../store/documents/documents.state';
import {selectCollectionById} from '../store/collections/collections.state';
import {take} from 'rxjs/operators';
import {selectLinkInstanceById} from '../store/link-instances/link-instances.state';
import {selectLinkTypeById} from '../store/link-types/link-types.state';
import {AttributesResource, DataResource} from '../model/resource';
import {findAttribute, findAttributeConstraint} from '../store/collections/collection.util';
import {UnknownConstraint} from '../model/constraint/unknown.constraint';
import {ClipboardService} from './clipboard.service';
import {isArray, isNotNullOrUndefined} from '../../shared/utils/common.utils';
import {DataValue} from '../model/data-value';
import {ConstraintData, ConstraintType} from '../model/data/constraint';
import {selectConstraintData} from '../store/constraint-data/constraint-data.state';
import {Constraint} from '../model/constraint';
import {UserDataValue} from '../model/data-value/user.data-value';

@Injectable({providedIn: 'root'})
export class CopyValueService {
  constructor(private store$: Store<AppState>, private clipboardService: ClipboardService) {}

  public copyDocumentValue(documentId: string, collectionId: string, attributeId: string) {
    combineLatest([
      this.store$.pipe(select(selectDocumentById(documentId))),
      this.store$.pipe(select(selectCollectionById(collectionId))),
      this.store$.pipe(select(selectConstraintData)),
    ])
      .pipe(take(1))
      .subscribe(([document, collection, constraintData]) =>
        this.copyValue(document, collection, attributeId, constraintData)
      );
  }

  public copyLinkValue(linkInstanceId: string, linkTypeId: string, attributeId: string) {
    combineLatest([
      this.store$.pipe(select(selectLinkInstanceById(linkInstanceId))),
      this.store$.pipe(select(selectLinkTypeById(linkTypeId))),
      this.store$.pipe(select(selectConstraintData)),
    ])
      .pipe(take(1))
      .subscribe(([linkInstance, linkType, constraintData]) =>
        this.copyValue(linkInstance, linkType, attributeId, constraintData)
      );
  }

  private copyValue(
    dataResource: DataResource,
    attributesResource: AttributesResource,
    attributeId: string,
    constraintData: ConstraintData
  ) {
    const constraint = findAttributeConstraint(attributesResource?.attributes, attributeId);
    const value = (constraint || new UnknownConstraint())
      .createDataValue(dataResource.data[attributeId], constraintData)
      .editValue();
    this.copy(value);
  }

  public copy(value: string) {
    this.clipboardService.copy(value);
  }

  public copyDataValues(dataValues: DataValue[], constraint: Constraint, unique?: boolean) {
    const {values} = dataValues.reduce(
      (data, dataValue) => {
        const serialized = dataValue.serialize();

        const checkAndAddValue = (currentDataValue: DataValue) => {
          const formatted = this.formatDataValueForCopy(currentDataValue, constraint);
          if (
            (!unique || !data.usedValues.has(formatted)) &&
            isNotNullOrUndefined(formatted) &&
            formatted?.trim() !== ''
          ) {
            data.values.push(formatted);
            data.usedValues.add(formatted);
          }
        };

        if (isArray(serialized)) {
          for (const value of serialized) {
            checkAndAddValue(dataValue.copy(value));
          }
        } else {
          checkAndAddValue(dataValue);
        }
        return data;
      },
      {values: [], usedValues: new Set()}
    );
    this.clipboardService.copy(values.join(', '));
  }

  private formatDataValueForCopy(dataValue: DataValue, constraint: Constraint): string {
    switch (constraint.type) {
      case ConstraintType.User:
        return (<UserDataValue>dataValue).format(true);
      default:
        return dataValue.format();
    }
  }

  public copyCollectionAttribute(collectionId: string, attributeId: string) {
    this.store$
      .pipe(select(selectCollectionById(collectionId)), take(1))
      .subscribe(collection => this.copyAttribute(collection, attributeId));
  }

  public copyLinkTypeAttribute(linkTypeId: string, attributeId: string) {
    this.store$
      .pipe(select(selectLinkTypeById(linkTypeId)), take(1))
      .subscribe(linkType => this.copyAttribute(linkType, attributeId));
  }

  private copyAttribute(attributesResource: AttributesResource, attributeId: string) {
    const attribute = findAttribute(attributesResource && attributesResource.attributes, attributeId);
    if (attribute) {
      this.copy(attribute.name);
    }
  }
}
