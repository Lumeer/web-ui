/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {ListRange} from '@angular/cdk/collections';
import {CdkVirtualScrollViewport, VirtualScrollStrategy} from '@angular/cdk/scrolling';
import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@Injectable()
export class TableVirtualScrollStrategy implements VirtualScrollStrategy {
  private rowHeight!: number;
  private headerHeight!: number;
  private footerHeight!: number;
  private buffer!: number;

  private indexChange$ = new Subject<number>();
  private disabled: boolean;
  private positionSnapshot: number;

  public stickyChange$ = new Subject<number>();

  public scrollStart$ = new Subject();
  public scrollEnd$ = new Subject();

  public viewport: CdkVirtualScrollViewport;

  public renderedRangeStream$ = new BehaviorSubject<ListRange>({start: 0, end: 0});

  public scrolledIndexChange = this.indexChange$.pipe(distinctUntilChanged());

  private previousScroll = 0;
  private scrollEndTimeout: number;

  get dataLength(): number {
    return this.viewport?.getDataLength() || 0;
  }

  public attach(viewport: CdkVirtualScrollViewport) {
    this.viewport = viewport;
    this.viewport.renderedRangeStream.subscribe(this.renderedRangeStream$);
    this.onDataLengthChanged();

    // const listener = event => {
    //   if (event.deltaY) {
    //     const offset = this.viewport.measureScrollOffset();
    //     let newOffset = offset + event.deltaY / 2;
    //     const scrollHeight = this.viewport.elementRef.nativeElement.scrollHeight - this.viewport.getViewportSize();
    //     newOffset = Math.min(scrollHeight, Math.max(0, newOffset));
    //     if (newOffset !== offset) {
    //       this.viewport.scrollToOffset(newOffset);
    //     }
    //     event.preventDefault();
    //   }
    //   return true;
    // };
    //
    // this.viewport.elementRef.nativeElement.addEventListener('wheel', listener);
  }

  public detach() {
    this.indexChange$.complete();
    this.stickyChange$.complete();
    this.renderedRangeStream$.complete();
  }

  public onContentScrolled() {
    this.updateContent();
    const currentScroll = this.viewport.measureScrollOffset();
    if (this.previousScroll !== currentScroll) {
      this.previousScroll = currentScroll;
      this.onScrollStart();
      this.scheduleScrollEnd();
    }
  }

  private onScrollStart() {
    if (!this.scrollEndTimeout) {
      this.scrollStart$.next(null);
    }
  }

  private scheduleScrollEnd() {
    window.clearTimeout(this.scrollEndTimeout);
    this.scrollEndTimeout = window.setTimeout(() => this.onScrollEnd(), 200);
  }

  private onScrollEnd() {
    this.scrollEnd$.next(null);
    this.scrollEndTimeout = null;
  }

  public onDataLengthChanged() {
    if (this.viewport) {
      this.viewport.setTotalContentSize(this.dataLength * this.rowHeight + this.headerHeight + this.footerHeight);
    }
    this.updateContent();
  }

  public onContentRendered() {
    // no-op
  }

  public onRenderedOffsetChanged() {
    // no-op
  }

  public scrollToIndex(index: number, behavior?: ScrollBehavior) {
    if (!this.viewport || !this.rowHeight) {
      return;
    }
    this.viewport.scrollToOffset((index - 1) * this.rowHeight + this.headerHeight);
  }

  public setDisabled(disabled: boolean) {
    this.disabled = disabled;
    if (this.disabled) {
      this.positionSnapshot = this.viewport.measureScrollOffset();
      this.viewport && (this.viewport.elementRef.nativeElement.style.overflow = 'hidden');
    } else {
      this.viewport && (this.viewport.elementRef.nativeElement.style.overflow = 'auto');
    }
  }

  public setConfig(rowHeight: number, headerHeight: number, footerHeight: number, buffer: number) {
    if (
      this.rowHeight === rowHeight &&
      this.headerHeight === headerHeight &&
      this.footerHeight === footerHeight &&
      this.buffer === buffer
    ) {
      return;
    }
    this.rowHeight = rowHeight;
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.buffer = buffer;
    this.onDataLengthChanged();
  }

  private updateContent() {
    if (!this.viewport || !this.rowHeight) {
      return;
    }

    const scrollOffset = this.viewport.measureScrollOffset();

    if (this.disabled) {
      this.viewport.scrollToOffset(this.positionSnapshot);
      return;
    }

    const amount = Math.ceil(this.viewport.getViewportSize() / this.rowHeight);
    const offset = Math.max(scrollOffset - this.headerHeight, 0);
    const buffer = this.buffer || 0;

    const skip = Math.round(offset / this.rowHeight);
    const index = Math.max(0, skip);
    const start = Math.max(0, index - buffer);
    const end = Math.min(this.dataLength, index + amount + buffer);
    const renderedOffset = start * this.rowHeight;
    this.viewport.setRenderedContentOffset(renderedOffset);
    this.viewport.setRenderedRange({start, end});
    this.indexChange$.next(index);
    this.stickyChange$.next(renderedOffset);
  }
}
