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

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'top-panel-wrapper',
  templateUrl: './top-panel-wrapper.component.html',
  styleUrls: ['./top-panel-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopPanelWrapperComponent implements OnInit, AfterViewInit {

  @Input()
  public searchBoxShown: boolean;

  @ViewChild('topPanel')
  public element: ElementRef;

  public mobile$ = new BehaviorSubject(true);

  public ngOnInit() {
    this.detectMobileResolution();
  }

  public ngAfterViewInit() {
    this.setTopPanelHeight();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.detectMobileResolution();
    this.setTopPanelHeight();
  }

  public onHeightChange() {
    this.setTopPanelHeight();
  }

  private detectMobileResolution() {
    this.mobile$.next(window.matchMedia('(max-width: 767.98px)').matches);
  }

  private setTopPanelHeight() {
    const element = this.element.nativeElement as HTMLElement;
    document.body.style.setProperty('--top-panel-height', `${element.clientHeight}px`);
  }

}
