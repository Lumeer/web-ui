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
import {PostItLayoutConfig} from './post-it-layout-config';

export class PostItLayout {

  protected layout: any;

  constructor(protected containerClassName: string, protected parameters: PostItLayoutConfig, protected zone: NgZone) {
    this.addContainerClassIdentifierIfMissing();
  }

  private addContainerClassIdentifierIfMissing(): void {
    if (!this.containerClassName.startsWith('.')) {
      this.containerClassName = '.' + this.containerClassName;
    }
  }

  public refresh(): void {
    setTimeout(() => {
      if (!this.containerExists()) {
        return;
      }

      this.zone.runOutsideAngular(() => {
        if (!this.layout) {
          this.layout = new window['Muuri'](this.containerClassName, this.parameters);
        }

        this.relayout();
      });
    });
  }

  protected relayout(): void {
    this.zone.runOutsideAngular(() => {
      // TODO fix the issue with collections not laying out correctly
      this.layout = new window['Muuri'](this.containerClassName, this.parameters);

      // this.layout
      //   .refreshItems()
      //   .layout();
    });
  }

  public add(element: HTMLElement): void {
    if (this.layout) {
      this.zone.runOutsideAngular(() => {
        this.layout.add(element);
      });
    }
  }

  public remove(element: HTMLElement): void {
    if (this.layout) {
      this.zone.runOutsideAngular(() => {
        this.layout.remove(element);
      });
    }
  }

  protected containerExists(): boolean {
    return !!(document.querySelector(this.containerClassName));
  }

}
