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
import {KanbanCard} from '../util/kanban-data';
import {AttributesResourceType} from '../../../../core/model/resource';
import {createAttributesSettingsOrder} from '../../../../shared/settings/settings.util';
import {ResourceAttributeSettings, ViewSettings} from '../../../../core/store/view-settings/view-settings';

@Pipe({
  name: 'filterKanbanCardsByPage',
})
export class FilterKanbanCardsByPagePipe implements PipeTransform {
  public transform(cards: KanbanCard[], viewSettings: ViewSettings, page: number, height: number): KanbanCard[] {
    // height of wrapper - header height - footer height
    const estimatedScrollableHeight = height - 40 - 40;
    const visibleHeight = (page + 1) * estimatedScrollableHeight * 2;
    let currentHeight = 0;
    for (let i = 0; i < cards.length; i++) {
      currentHeight += this.estimatedCardHeight(cards[i], viewSettings);
      if (i > 0 && currentHeight > visibleHeight) {
        return cards.slice(0, i);
      }
    }

    return cards;
  }

  private estimatedCardHeight(card: KanbanCard, viewSettings: ViewSettings): number {
    const resourceAttributesSettings = this.cardAttributesSettings(viewSettings, card);
    const numShowedAttributes = createAttributesSettingsOrder(
      card.resource.attributes,
      resourceAttributesSettings
    ).filter(attribute => !attribute.hidden).length;

    // number of attributes * min row height + padding + header height
    return numShowedAttributes * 32 + 20 + 40;
  }

  public cardAttributesSettings(settings: ViewSettings, card: KanbanCard): ResourceAttributeSettings[] {
    if (card.resourceType === AttributesResourceType.Collection) {
      return settings?.attributes?.collections?.[card.resource.id];
    } else if (card.resourceType === AttributesResourceType.LinkType) {
      return settings?.attributes?.linkTypes?.[card.resource.id];
    }

    return [];
  }
}
