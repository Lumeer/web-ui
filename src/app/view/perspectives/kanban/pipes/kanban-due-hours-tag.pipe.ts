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
import {COLOR_DANGER, COLOR_WARNING} from '../../../../core/constants';
import {PostItTag} from '../../../../shared/post-it/post-it.component';
import {isNotNullOrUndefined} from '@lumeer/utils';

@Pipe({
  name: 'kanbanDueHoursTag',
})
export class KanbanDueHoursTagPipe implements PipeTransform {
  public transform(dueHours: number): PostItTag {
    if (isNotNullOrUndefined(dueHours)) {
      if (dueHours < 0) {
        return {
          title: $localize`:@@kanban.dueHours.tag.pastDue:Past due`,
          color: COLOR_DANGER,
        };
      }
      if (dueHours < 73) {
        return {
          title: $localize`:@@kanban.dueHours.tag.dueSoon:Due soon`,
          color: COLOR_WARNING,
        };
      }
    }

    return null;
  }
}
