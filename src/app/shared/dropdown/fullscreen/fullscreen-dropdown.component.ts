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

import {Component, ChangeDetectionStrategy, ViewContainerRef, Renderer2, AfterViewInit, ViewChild, TemplateRef, Input} from '@angular/core';
import {GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';
import {BehaviorSubject, Observable} from 'rxjs';

@Component({
  selector: 'fullscreen-dropdown',
  templateUrl: './fullscreen-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenDropdownComponent implements AfterViewInit {

  @Input()
  public showBackdrop = true;

  @ViewChild('dropdown')
  public dropdown: TemplateRef<any>;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;
  private opened$ = new BehaviorSubject(false);

  constructor(private overlay: Overlay, private viewContainer: ViewContainerRef, private renderer: Renderer2) {}

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.dropdown, this.viewContainer);
  }

  public open(offsetX?: number) {
    if (this.overlayRef) {
      return;
    }

    this.opened$.next(true);

    const overlayConfig = this.createOverlayConfig(offsetX);

    this.overlayRef = this.overlay.create(overlayConfig);
    this.overlayRef.attach(this.portal);
  }

  private createOverlayConfig(offsetX?: number): OverlayConfig {
    const positionStrategy = this.createPositionStrategy();

    return {
      backdropClass: this.showBackdrop ? 'cdk-overlay-transparent-backdrop' : undefined,
      disposeOnNavigation: true,
      hasBackdrop: this.showBackdrop,
      // scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy,
    };
  }

  private createPositionStrategy(): GlobalPositionStrategy {
    return this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically()
      .top('200px')
      .right('100px')
      .left('100px');
  }

  public close() {
    this.opened$.next(false);
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  public isOpen(): boolean {
    return this.opened$.value;
  }

  public isOpen$(): Observable<boolean> {
    return this.opened$.asObservable();
  }

}
