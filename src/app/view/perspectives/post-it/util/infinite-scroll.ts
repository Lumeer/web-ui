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

declare var $: any;

export class InfiniteScroll {

  private gettingData: boolean;

  private onScroll: () => void;

  private userHitBottom: () => boolean;

  private scrollEventOptions = {
    capture: true,
    passive: true
  };

  constructor(private callback: () => void, private parent: HTMLElement, private useParentScrollbar) {
  }

  public setUseParentScrollbar(value: boolean): void {
    this.useParentScrollbar = value;
    this.setTrackedScrollbar();
  }

  public initialize(): void {
    this.setTrackedScrollbar();
    this.turnOffInfiniteScroll();

    this.onScroll = () => {
      if (this.userHitBottom()) {
        this.callback();
      }
    };

    this.turnOnInfiniteScroll();
  }

  private setTrackedScrollbar() {
    this.userHitBottom = this.useParentScrollbar ?
      () => this.parent.scrollTop >= this.parent.scrollHeight - 400 :
      () => $(window).scrollTop() + $(window).height() > $(document).height() - 400;
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

  public unsubscribe(): void {
    this.turnOffInfiniteScroll();
  }

}
