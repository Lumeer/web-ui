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

import {NgZone} from '@angular/core';
import {PostItLayout} from './post-it-layout';
import {PostItLayoutConfig} from './post-it-layout-config';

export class PostItSortingLayout extends PostItLayout {

  constructor(containerClassName: string,
              parameters: PostItLayoutConfig,
              sortFunction: (item: any, element: HTMLElement) => number,
              selectorOfDraggableElements: string,
              zone: NgZone) {

    super(containerClassName, parameters, zone);
    this.setSortingParameters(selectorOfDraggableElements, sortFunction);
  }

  private setSortingParameters(selectorOfDraggableElements: string, sortFunction: (item: any, element: HTMLElement) => number) {
    this.parameters.dragEnabled = true;

    this.parameters.layoutOnInit = false;

    this.parameters.dragStartPredicate = {
      distance: 15,
      delay: 40,
      handle: selectorOfDraggableElements
    };

    this.parameters.sortData = {
      order: sortFunction
    };
  }

  public refresh(): void {
    setTimeout(() => {
      if (!this.containerExists()) {
        return;
      }

      this.zone.runOutsideAngular(() => {
        const layout = new window['Muuri'](this.containerClassName, this.parameters);
        layout.sort('order', {layout: 'instant'});
      });
    });
  }

}
