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

import {AfterContentInit, Directive, forwardRef, Input, OnChanges, OnDestroy} from '@angular/core';
import {VIRTUAL_SCROLL_STRATEGY} from '@angular/cdk/scrolling';
import {takeWhile, tap} from 'rxjs/operators';
import {TableVirtualScrollStrategy} from './table-virtual-scroll-strategy';
import {TABLE_ROW_HEIGHT} from '../model/table-model';

export function _tableVirtualScrollDirectiveStrategyFactory(tableDir: TableItemSizeDirective) {
  return tableDir.scrollStrategy;
}

const stickyHeaderSelector = '.lmr-table .sticky-header';

const defaults = {
  rowHeight: TABLE_ROW_HEIGHT,
  headerHeight: TABLE_ROW_HEIGHT,
  headerEnabled: true,
  footerHeight: TABLE_ROW_HEIGHT,
  footerEnabled: false,
  bufferMultiplier: 0,
};

@Directive({
  selector: 'cdk-virtual-scroll-viewport[lmrItemSize]',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _tableVirtualScrollDirectiveStrategyFactory,
      deps: [forwardRef(() => TableItemSizeDirective)],
    },
  ],
})
export class TableItemSizeDirective implements OnChanges, AfterContentInit, OnDestroy {
  private alive = true;

  @Input('lmrItemSize')
  public rowHeight = defaults.rowHeight;

  @Input()
  public headerEnabled = defaults.headerEnabled;

  @Input()
  public headerHeight = defaults.headerHeight;

  @Input()
  public footerEnabled = defaults.footerEnabled;

  @Input()
  public footerHeight = defaults.footerHeight;

  @Input()
  public bufferMultiplier = defaults.bufferMultiplier;

  @Input()
  public disabled: boolean;

  public scrollStrategy = new TableVirtualScrollStrategy();

  private stickyPositions: Map<HTMLElement, number>;

  public ngOnDestroy() {
    this.alive = false;
  }

  private isAlive() {
    return () => this.alive;
  }

  public ngAfterContentInit() {
    this.scrollStrategy.stickyChange$
      .pipe(
        tap(() => {
          if (!this.stickyPositions) {
            this.initStickyPositions();
          }
        }),
        takeWhile(this.isAlive())
      )
      .subscribe(stickyOffset => {
        this.setStickyHeader(stickyOffset);
      });

    this.scrollStrategy.scrollStart$.pipe(takeWhile(this.isAlive())).subscribe(() => this.onScrollChange(false));

    this.scrollStrategy.scrollEnd$.pipe(takeWhile(this.isAlive())).subscribe(() => this.onScrollChange(true));
  }

  private onScrollChange(end: boolean) {
    const parentElement = this.scrollStrategy.viewport.elementRef.nativeElement.parentElement;
    const alternativeHeader = parentElement.querySelector('.alternative-header');
    if (end) {
      alternativeHeader.classList.remove('visible');
    } else {
      alternativeHeader.classList.add('visible');
    }

    this.scrollStrategy.viewport.elementRef.nativeElement.querySelectorAll(stickyHeaderSelector).forEach(el => {
      if (end) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }

  public ngOnChanges() {
    const config = {
      rowHeight: +this.rowHeight || defaults.rowHeight,
      headerHeight: this.headerEnabled ? +this.headerHeight || defaults.headerHeight : 0,
      footerHeight: this.footerEnabled ? +this.footerHeight || defaults.footerHeight : 0,
      bufferMultiplier: +this.bufferMultiplier || defaults.bufferMultiplier,
    };
    this.scrollStrategy.setConfig(config.rowHeight, config.headerHeight, config.footerHeight, config.bufferMultiplier);
    this.scrollStrategy.setDisabled(this.disabled);
  }

  public setStickyHeader(offset: number) {
    this.scrollStrategy.viewport.elementRef.nativeElement
      .querySelectorAll(stickyHeaderSelector)
      .forEach((el: HTMLElement) => {
        const parent = el.parentElement;
        let baseOffset = 0;
        if (this.stickyPositions.has(parent)) {
          baseOffset = this.stickyPositions.get(parent);
        }
        el.style.top = `-${-baseOffset + offset}px`;
      });
  }

  private initStickyPositions() {
    this.stickyPositions = new Map<HTMLElement, number>();
    this.scrollStrategy.viewport.elementRef.nativeElement.querySelectorAll(stickyHeaderSelector).forEach(el => {
      const parent = el.parentElement;
      if (!this.stickyPositions.has(parent)) {
        this.stickyPositions.set(parent, parent.offsetTop);
      }
    });
  }
}
