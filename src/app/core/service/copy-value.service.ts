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
import {selectDocumentById} from '../store/documents/documents.state';
import {selectCollectionById} from '../store/collections/collections.state';
import {take} from 'rxjs/operators';
import {selectLinkInstanceById} from '../store/link-instances/link-instances.state';
import {selectLinkTypeById} from '../store/link-types/link-types.state';
import {AttributesResource} from '../model/resource';
import {findAttribute} from '../store/collections/collection.util';
import {ClipboardService} from './clipboard.service';
import {isArray, isNotNullOrUndefined} from '../../shared/utils/common.utils';
import {DataValue} from '../model/data-value';

@Injectable({providedIn: 'root'})
export class CopyValueService {
  constructor(private store$: Store<AppState>, private clipboardService: ClipboardService) {}

  public copyDocumentValue(documentId: string, collectionId: string, attributeId: string) {
    this.store$
      .pipe(select(selectDocumentById(documentId)), take(1))
      .subscribe(document => this.copy(document.dataValues?.[attributeId]?.editValue()));
  }

  public copyLinkValue(linkInstanceId: string, linkTypeId: string, attributeId: string) {
    this.store$
      .pipe(select(selectLinkInstanceById(linkInstanceId)), take(1))
      .subscribe(linkInstance => this.copy(linkInstance.dataValues?.[attributeId]?.editValue()));
  }

  public copy(value: string) {
    this.clipboardService.copy(value);
  }

  public copyDataValues(dataValues: DataValue[], unique?: boolean) {
    const {values} = dataValues.reduce(
      (data, dataValue) => {
        const serialized = dataValue.serialize();

        const checkAndAddValue = (currentDataValue: DataValue) => {
          const formatted = currentDataValue.format();
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
    const attribute = findAttribute(attributesResource?.attributes, attributeId);
    if (attribute) {
      this.copy(attribute.name);
    }
  }
}
