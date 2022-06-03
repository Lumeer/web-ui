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

import {CollectionPurposeType} from '../../core/store/collections/collection';

export namespace Translation {
  export function newRecordTitle(purpose: CollectionPurposeType): string {
    switch (purpose) {
      case CollectionPurposeType.Tasks:
        return $localize`:@@record.new.title.tasks:New task`;
      default:
        return $localize`:@@record.new.title.default:New record`;
    }
  }

  export function newSubRecordTitle(purpose: CollectionPurposeType): string {
    switch (purpose) {
      case CollectionPurposeType.Tasks:
        return $localize`:@@record.new.child.title.tasks:Add sub-task`;
      default:
        return $localize`:@@record.new.child.title.default:Add sub-item`;
    }
  }

  export function tableSubParentRecordTitle(purpose: CollectionPurposeType): string {
    switch (purpose) {
      case CollectionPurposeType.Tasks:
        return $localize`:@@record.new.subParent.title.tasks:Add task at this level`;
      default:
        return $localize`:@@record.new.subParent.title.default:Add item at this level`;
    }
  }

  export function tableNewRowTitle(purpose: CollectionPurposeType): string {
    switch (purpose) {
      case CollectionPurposeType.Tasks:
        return $localize`:@@create.new.task:Add new task`;
      default:
        return $localize`:@@create.new.row:Add new row`;
    }
  }
}
