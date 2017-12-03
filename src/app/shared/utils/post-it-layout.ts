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

import {Buffer} from './buffer';
import {NgZone} from '@angular/core';

/**
 * Provides Pinterest-like layout using minigrid library http://minigrid.js.org/
 */
export class PostItLayout {

  private resizeListener;

  /**
   * Lock making sure that at most only a few refresh request are sent..
   * if the requests get too frequent, the updating locks for a certain time
   */
  private requestLock = 0;

  private locked = false;

  private readonly REQUEST_LOCK_LIMIT = 20;

  private readonly UPDATE_LOCK_TIME = 2000;

  private destroyed = false;

  constructor(private parameters: object, private zone?: NgZone) {
    const windowResizeRefreshBuffer = new Buffer(() => this.refresh(), 500);
    this.resizeListener = () => windowResizeRefreshBuffer.stageChanges();

    window.addEventListener('resize', this.resizeListener);
  }

  public refresh(): void {
    if (this.locked) {
      return;
    }

    if (this.zone && this.requestLock > this.REQUEST_LOCK_LIMIT) {
      this.zone.runOutsideAngular(() => {
        window.setTimeout(() => this.locked = false, this.UPDATE_LOCK_TIME);
        this.safeRefresh();
      });

      this.locked = true;
      return;
    }

    setTimeout(() => {
      if (this.destroyed) {
        return;
      }

      new window['Minigrid'](this.parameters).mount();
    });

    if (this.zone) {
      this.requestLock++;

      this.zone.runOutsideAngular(() =>
        window.setTimeout(() => this.requestLock--, 750)
      );
    }
  }

  public safeRefresh(): void {
    setTimeout(() => {
      if (this.destroyed) {
        return;
      }

      new window['Minigrid'](this.parameters).mount();
    });
  }

  public destroy(): void {
    this.destroyed = true;
    window.removeEventListener('resize', this.resizeListener);
  }

}
