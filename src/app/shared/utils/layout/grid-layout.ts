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

interface MovePosition {
  fromIndex: number;
  toIndex: number;
}

export class GridLayout {
  private muuri: any;
  private movePosition: MovePosition;

  private mutationObserver: MutationObserver;
  private lastChangedTime: Date;
  private intervalId: number;
  private correctionIntervalId: number;

  public constructor(selector: string, options: any, zone: NgZone, onMove?: (event: MovePosition) => any) {
    setTimeout(() => {
      if (!GridLayout.containerElementExists(selector)) {
        return;
      }

      zone.runOutsideAngular(() => {
        this.muuri = new window['Muuri'](selector, options);
        this.muuri.on('move', event => (this.movePosition = event));
        this.muuri.on('dragReleaseEnd', () => {
          if (this.movePosition) {
            onMove(this.movePosition);
            this.movePosition = null;
          }
        });

        this.refreshSizeOnChangesInside(selector);
      });
    });
  }

  private refreshSizeOnChangesInside(selector: string) {
    this.mutationObserver = new MutationObserver(() => (this.lastChangedTime = new Date()));
    this.mutationObserver.observe(document.querySelector(selector), {attributes: true, childList: true, subtree: true});
    this.intervalId = window.setInterval(() => this.refreshSize(), 100);
  }

  private refreshSize() {
    if (this.muuri && this.lastChangedTime && new Date().valueOf() - this.lastChangedTime.valueOf() < 120) {
      this.muuri.refreshItems().layout();
    }
  }

  public destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
    if (this.correctionIntervalId) {
      window.clearInterval(this.correctionIntervalId);
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.muuri) {
      this.muuri.destroy();
      this.muuri = null;
    }
  }

  private static containerElementExists(selector: string): boolean {
    return !!document.querySelector(selector);
  }
}
