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

import {SelectConstraintOption} from '@lumeer/data-filters';
import {selectDefaultPalette} from '../../picker/colors';

export interface SelectionList {
  id?: string;
  name: string;
  organizationId?: string;
  projectId?: string;
  displayValues?: boolean;
  options: SelectConstraintOption[];
}

export const predefinedSelectionLists: SelectionList[] = [
  {
    id: '_task',
    name: $localize`:@@selection.lists.predefined.tasks:Tasks`,
    displayValues: true,
    options: [
      {value: '0', displayValue: 'New', background: selectDefaultPalette[0]},
      {value: '1', displayValue: 'Cancelled', background: selectDefaultPalette[1]},
      {value: '2', displayValue: 'In Progress', background: selectDefaultPalette[2]},
      {value: '3', displayValue: 'Testing', background: selectDefaultPalette[3]},
      {value: '4', displayValue: 'Done', background: selectDefaultPalette[4]},
      {value: '5', displayValue: 'In Production', background: selectDefaultPalette[5]},
    ],
  },
  {
    id: '_event',
    name: $localize`:@@selection.lists.predefined.events:Events`,
    displayValues: true,
    options: [
      {value: '0', displayValue: 'Scheduled', background: selectDefaultPalette[0]},
      {value: '1', displayValue: 'Cancelled', background: selectDefaultPalette[1]},
      {value: '2', displayValue: 'In Progress', background: selectDefaultPalette[2]},
      {value: '3', displayValue: 'Finished', background: selectDefaultPalette[3]},
    ],
  },
];
