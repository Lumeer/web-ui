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

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit} from '@angular/core';

declare let ResizeObserver: ResizeObserver;

@Component({
  selector: 'browser-warning',
  templateUrl: './browser-warning.component.html',
  styleUrls: ['./browser-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserWarningComponent implements OnInit, AfterViewInit {
  public open = true;

  private resizeObserver: ResizeObserver;

  constructor(private element: ElementRef<HTMLElement>) {}

  public ngOnInit() {
    if (window['ResizeObserver']) {
      this.resizeObserver = new ResizeObserver(entries => this.onElementResize(entries));
    }
  }

  private onElementResize(entries: ResizeObserverEntry[]) {
    const {height} = entries[0].contentRect;
    this.setBrowserWarningHeight(height);
  }

  public ngAfterViewInit() {
    if (window['ResizeObserver']) {
      this.resizeObserver.observe(this.element.nativeElement);
    } else {
      setTimeout(() => this.setBrowserWarningHeight(this.element.nativeElement.offsetHeight), 1000);
    }
  }

  public ngOnDestroy() {
    this.disconnectResizeObserver();
  }

  public onClose() {
    this.disconnectResizeObserver();
  }

  private disconnectResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  public onClosed() {
    this.open = false;
    this.unsetBrowserWarningHeight();
  }

  private setBrowserWarningHeight(height: number) {
    document.body.style.setProperty('--browser-warning-height', `${height}px`);
  }

  private unsetBrowserWarningHeight() {
    document.body.style.removeProperty('--browser-warning-height');
  }
}
