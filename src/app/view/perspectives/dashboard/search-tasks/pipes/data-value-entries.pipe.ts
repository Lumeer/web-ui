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

import {Pipe, PipeTransform} from '@angular/core';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {SizeType} from '../../../../../shared/slider/size/size-type';
import {SearchTasksConfig} from '../../../../../core/store/searches/search';
import {getDefaultAttributeId} from '../../../../../core/store/collections/collection.util';
import {Constraint, ConstraintData, ConstraintType, DataValue, UnknownConstraint} from '@lumeer/data-filters';
import {TaskAttributes} from '../model/task-attributes';
import {View} from '../../../../../core/store/views/view';
import {createAttributesSettingsOrder} from '../../../../../shared/settings/settings.util';
import {ResourceAttributeSettings} from '../../../../../core/store/view-settings/view-settings';
import {objectsByIdMap} from '@lumeer/utils';

@Pipe({
  name: 'dataValueEntries',
})
export class DataValueEntriesPipe implements PipeTransform {
  public transform(
    document: DocumentModel,
    collection: Collection,
    taskAttributes: TaskAttributes,
    views: View[],
    constraintData: ConstraintData,
    config: SearchTasksConfig
  ): {label?: string; attributeId: string; isDefault?: boolean; dataValue: DataValue; constraint: Constraint}[] {
    const expanded =
      config?.size === SizeType.L || config?.size === SizeType.XL || (config?.expandedIds || []).includes(document.id);
    const defaultAttributeId = getDefaultAttributeId(collection);
    const collectionSettings = this.findAttributesSettings(collection, views);
    const attributesMap = objectsByIdMap(collection.attributes);
    return createAttributesSettingsOrder(collection.attributes, collectionSettings)
      .filter(setting => !setting.hidden && !taskAttributes?.usedAttributes?.has(setting.attributeId))
      .reduce((array, setting) => {
        const attribute = attributesMap[setting.attributeId];
        const constraint: Constraint = attribute.constraint || new UnknownConstraint();

        // showing disabled buttons doesn't make sense
        if (constraint.type === ConstraintType.Action) {
          return array;
        }

        const dataValue = constraint.createDataValue(document.data[attribute.id], constraintData);
        if (expanded || constraint.isDirectlyEditable || !!dataValue.format()) {
          const label = expanded ? attribute.name : null;
          array.push({
            label,
            dataValue,
            attributeId: attribute.id,
            constraint,
            isDefault: defaultAttributeId === attribute.id,
          });
        }

        return array;
      }, []);
  }

  private findAttributesSettings(collection: Collection, views: View[]): ResourceAttributeSettings[] {
    const defaultViewCode = collection.purpose?.metaData?.defaultViewCode;
    const defaultView = defaultViewCode && views.find(view => view.code === defaultViewCode);
    const stemsConfigs = defaultView?.config?.detail?.stemsConfigs || [];
    const stemConfig = stemsConfigs.find(config => config.stem?.collectionId === collection.id);
    return stemConfig?.attributesSettings?.collections?.[collection.id];
  }
}
