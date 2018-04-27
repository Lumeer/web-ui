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

import {NgZone} from "@angular/core";

export class PostItLayout {

  private grid = null;
  private dragOrder = [];

  constructor(private gridElement: any,
              private dragEnabled: boolean,
              private zone: NgZone) {
    this.initGrid();
  }

  private initGrid() {
    this.runSafely(() => {
      this.grid = new window['Muuri'](
        this.gridElement,
        {
          layoutDuration: 400,
          layoutEasing: 'ease',
          dragEnabled: this.dragEnabled,
          dragSortInterval: 500,
          dragReleaseDuration: 500,
          dragReleaseEasing: 'ease',
          layoutOnResize: 500,
          layoutOnInit: true,
          layout: {
            fillGaps: false,
            horizontal: false,
            alignRight: false,
            alignBottom: false,
            rounding: true
          },
          dragStartPredicate: {
            distance: 0,
            delay: 0,
            handle: false
          },
          dragSort: true,
          dragSortPredicate: {
            threshold: 50,
            action: 'move'
          },
        }
      ).on('move', () => this.updateIndices())
        .on('sort', () => this.updateIndices());
    });
  }

  public addItem(newElement: any, index: number) {
    this.runSafely(() => {
      const added = this.grid.add(newElement, {index: index});
      this.dragOrder.splice(index, 0, added);
      this.updateIndices()
    });
  }

  public removeItem(removed: any) {
    this.runSafely(() => {
      this.grid.remove(removed, {removeElements: true});

      const itemIndex = this.dragOrder.indexOf(removed);
      if (itemIndex > -1) {
        this.dragOrder.splice(itemIndex, 1);
      }

      this.updateIndices();
    });
  }

  private updateIndices() {
    this.runSafely(() => {
      this.grid.getItems().forEach((item, i) => {
        item.getElement().setAttribute('order', i);
        item.getElement().querySelector('.TEST') && (item.getElement().querySelector('.TEST').innerHTML = i);
      });
    });
  }

  private runSafely(fun: () => void) {
    this.zone.runOutsideAngular(() => fun());
  }

}
