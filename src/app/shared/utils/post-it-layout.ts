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

export interface PostItLayoutConfig {

  container: string;
  item: string;
  gutter: number;

}

/**
 * Provides Pinterest-like layout using minigrid library http://minigrid.js.org/
 */
export class PostItLayout {

  private resizeListener: () => void;

  private containerClassName: string;

  constructor(private parameters: PostItLayoutConfig) {
    this.containerClassName = parameters.container.slice(1);

    const windowResizeRefreshBuffer = new Buffer(() => this.refresh(), 500);
    this.resizeListener = () => windowResizeRefreshBuffer.stageChanges();

    window.addEventListener('resize', this.resizeListener);
  }

  public refresh(): void {
    setTimeout(() => {
      if (!this.containerExists()) {
        return;
      }

      new window['Minigrid'](this.parameters).mount();
    });
  }

  private containerExists(): boolean {
    return !!(document.getElementsByClassName(this.containerClassName).length);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

}
