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
import {Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../select/select-item/select-item.model';
import {Query} from '../../../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {objectsByIdMap} from '../../../utils/common.utils';
import {CalendarConfig} from '../../../../core/store/calendars/calendar';
import {calendarStemConfigIsWritable} from '../../../../view/perspectives/calendar/util/calendar-util';
import {collectionSelectItem} from '../../../select/select-item.utils';

@Pipe({
  name: 'stemCollectionsItems',
})
export class StemCollectionItemsPipe implements PipeTransform {
  public transform(
    query: Query,
    config: CalendarConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    permissions: Record<string, AllowedPermissions>
  ): SelectItemModel[] {
    const linkTypesMap = objectsByIdMap(linkTypes);
    return (query.stems || []).reduce((models, stem, index) => {
      const calendarStemConfig = config?.stemsConfigs?.[index];
      const collection = (collections || []).find(coll => coll.id === stem.collectionId);
      if (collection && calendarStemConfigIsWritable(calendarStemConfig, permissions, linkTypesMap)) {
        models.push(collectionSelectItem(collection, () => index));
      }
      return models;
    }, []);
  }
}
