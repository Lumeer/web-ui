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

export class InfiniteScrollManager {

  private gettingData: boolean;

  private onScroll: () => void;

  private scrollEventOptions = {
    capture: true,
    passive: true
  };

  constructor(private callback: () => void) {
  }

  public initialize(): void {
    this.onScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 550) {
        this.callback();
      }
    };

    this.turnOnInfiniteScroll();
  }

  public isLoading(): boolean {
    return this.gettingData;
  }

  public startLoading(): void {
    this.gettingData = true;
    this.turnOffInfiniteScroll();
  }

  public finishLoading(): void {
    this.gettingData = false;
    this.turnOnInfiniteScroll();
  }

  private turnOnInfiniteScroll(): void {
    (window as any).addEventListener('scroll', this.onScroll, this.scrollEventOptions);
  }

  private turnOffInfiniteScroll(): void {
    (window as any).removeEventListener('scroll', this.onScroll, this.scrollEventOptions);
  }

  public destroy(): void {
    this.turnOffInfiniteScroll();
  }

}
