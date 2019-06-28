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

/**
 * Dropdown position related to origin element.
 */
import {ConnectedPosition} from '@angular/cdk/overlay';

export enum DropdownPosition {
  BottomEnd = 'BottomEnd',
  BottomStart = 'BottomStart',
  Left = 'Left',
  Right = 'Right',
  TopEnd = 'TopEnd',
  TopStart = 'TopStart',
}

export const connectedPositionsMap: Record<DropdownPosition, ConnectedPosition> = {
  [DropdownPosition.BottomEnd]: {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
  },
  [DropdownPosition.BottomStart]: {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  },
  [DropdownPosition.Left]: {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
  },
  [DropdownPosition.Right]: {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
  },
  [DropdownPosition.TopEnd]: {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
  },
  [DropdownPosition.TopStart]: {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  },
};

export function convertDropdownToConnectedPositions(dropdownPositions: DropdownPosition[]): ConnectedPosition[] {
  return dropdownPositions.map(dropdownPosition => connectedPositionsMap[dropdownPosition]);
}
