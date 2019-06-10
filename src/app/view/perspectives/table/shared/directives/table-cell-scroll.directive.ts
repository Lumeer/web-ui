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

import {AfterViewChecked, Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';

@Directive({
  selector: '[tableCellScroll]',
})
export class TableCellScrollDirective implements OnChanges, AfterViewChecked, OnDestroy {
  @Input()
  public cursor: TableCursor;

  @Input()
  public selected: boolean;

  private intersectionObserver: IntersectionObserver;

  constructor(private element: ElementRef<HTMLElement>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected && !this.selected && this.intersectionObserver) {
      this.destroyIntersectionObserver();
    }
  }

  public ngAfterViewChecked() {
    if (this.selected && !this.intersectionObserver) {
      this.initIntersectionObserver();
    }
  }

  public ngOnDestroy() {
    this.destroyIntersectionObserver();
  }

  private initIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(entries => this.scrollIntoViewUnlessFullyVisible(entries));
    this.intersectionObserver.observe(this.element.nativeElement);
  }

  private scrollIntoViewUnlessFullyVisible(entries: IntersectionObserverEntry[]) {
    if (!isWholeElementVisible(entries) && this.element) {
      this.element.nativeElement.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  }

  private destroyIntersectionObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}

function isWholeElementVisible(entries: IntersectionObserverEntry[]) {
  return entries && entries[0] && entries[0].intersectionRatio === 1;
}
