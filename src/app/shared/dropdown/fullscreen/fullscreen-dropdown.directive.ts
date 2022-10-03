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

import {Input, ElementRef, ViewChild, Directive, AfterViewInit, OnDestroy} from '@angular/core';
import {FullscreenDropdownComponent} from './fullscreen-dropdown.component';
import {BehaviorSubject, Subscription} from 'rxjs';

@Directive()
export abstract class FullscreenDropdownDirective implements AfterViewInit, OnDestroy {
  @Input()
  public origin: ElementRef | HTMLElement;

  @ViewChild(FullscreenDropdownComponent)
  public dropdown: FullscreenDropdownComponent;

  public isOpen$ = new BehaviorSubject(false);

  private subscription = new Subscription();

  public ngAfterViewInit() {
    if (this.dropdown) {
      this.subscription.add(this.dropdown.isOpen$().subscribe(open => this.isOpen$.next(open)));
    }
  }

  public toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public open() {
    this.dropdown?.open();
  }

  public close() {
    this.dropdown?.close();
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
