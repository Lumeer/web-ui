/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Axis} from './Axis';

export class PostItLayoutConfig {
  public items = '.layout-item';

  public showDuration = 300;

  public showEasing = 'ease';

  public hideDuration = 300;

  public hideEasing = 'ease';

  public visibleStyles: object = {
    opacity: '1',
    transform: 'scale(1)',
  };

  public hiddenStyles: object = {
    opacity: '0',
    transform: 'scale(0.5)',
  };

  public layout: {
    fillGaps: boolean;
    horizontal: boolean;
    alignRight: boolean;
    alignBottom: boolean;
    rounding: boolean;
  } = {
    fillGaps: false,
    horizontal: false,
    alignRight: false,
    alignBottom: false,
    rounding: true,
  };

  public layoutOnResize = 200;

  public layoutOnInit = true;

  public layoutDuration = 400;

  public layoutEasing = 'ease';

  public sortData: object = null;

  public dragEnabled = false;

  public dragContainer: HTMLElement = null;

  public dragStartPredicate: {distance: number; delay: number; handle: boolean | string} = {
    distance: 0,
    delay: 0,
    handle: false,
  };

  public dragAxis: Axis = null;

  public dragSort = true;

  public dragSortInterval = 200;

  public dragSortPredicate: {threshold: number; action: string} = {
    threshold: 50,
    action: 'move',
  };

  public dragReleaseDuration = 300;

  public dragReleaseEasing = 'ease';

  public dragHammerSettings: {touchAction: string} = {
    touchAction: 'none',
  };

  public containerClass: 'muuri';

  public itemClass: 'muuri-item';

  public itemVisibleClass: 'muuri-item-shown';

  public itemHiddenClass: 'muuri-item-hidden';

  public itemPositioningClass: 'muuri-item-positioning';

  public itemDraggingClass: 'muuri-item-dragging';

  public itemReleasingClass: 'muuri-item-releasing';
}
