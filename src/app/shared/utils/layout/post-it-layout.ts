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

import {ElementRef, NgZone} from '@angular/core';

import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export class PostItLayout {

  private grid = null;
  private refreshSubject = new Subject();
  private subscriptions = new Subscription();

  constructor(private gridElement: ElementRef,
              private dragEnabled: boolean,
              private zone: NgZone) {
    this.initGrid();
  }

  private initGrid() {
    this.runSafely(() => {
      this.grid = new window['Muuri'](
        this.gridElement.nativeElement,
        {
          layoutDuration: 200,
          layoutEasing: 'ease',
          dragEnabled: this.dragEnabled,
          dragSortInterval: 200,
          dragReleaseDuration: 200,
          dragReleaseEasing: 'ease',
          layoutOnResize: 200,
          layoutOnInit: true,
          layout: {
            fillGaps: false,
            horizontal: false,
            alignRight: false,
            alignBottom: false,
            rounding: false
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

    const subscription = this.refreshSubject.pipe(
      debounceTime(200)
    ).subscribe(() => {
      this.onRefresh();
    });

    this.subscriptions.add(subscription);
  }

  public addItem(newElement: any, index: number) {
    this.runSafely(() => {
      const added = this.grid.add(newElement, {index: index});
      this.updateIndices();
    });
  }

  public removeItem(removed: any) {
    this.runSafely(() => {
      this.grid.remove(removed, {removeElements: true});
      this.updateIndices();
    });
  }

  public refresh() {
    this.refreshSubject.next();
  }

  private onRefresh() {
    setTimeout(() => {
      this.grid
        .refreshItems()
        .synchronize()
        .layout();
    });
  }

  private updateIndices() {
    this.runSafely(() => {
      this.grid.getItems().forEach((item, i) => {
        item.getElement().setAttribute('order', i);
      });
    });
  }

  private runSafely(fun: () => void) {
    this.zone.runOutsideAngular(() => fun());
  }

}
