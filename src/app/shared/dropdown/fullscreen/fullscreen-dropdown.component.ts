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

import {
  Component,
  ChangeDetectionStrategy,
  ViewContainerRef,
  Renderer2,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  Input,
} from '@angular/core';
import {GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';
import {CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject, Observable} from 'rxjs';

@Component({
  selector: 'fullscreen-dropdown',
  templateUrl: './fullscreen-dropdown.component.html',
  styleUrls: ['./fullscreen-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenDropdownComponent implements AfterViewInit {
  @Input()
  public height: number;

  @Input()
  public showBackdrop = true;

  @Input()
  public minHeight: number = 100;

  @Input()
  public minWidth: number = 100;

  @Input()
  public minSize: number;

  @ViewChild('dropdown')
  public dropdown: TemplateRef<any>;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;

  private initialBoundingRect: DOMRect;
  private initialResizePosition: {x: number; y: number};

  public opened$ = new BehaviorSubject(false);
  public resizePosition$ = new BehaviorSubject({x: 0, y: 0});

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
    this.overlayRef.addPanelClass('m-5');
    this.overlayRef.backdropClick().subscribe(() => this.close());
  }

  private createOverlayConfig(offsetX?: number): OverlayConfig {
    const positionStrategy = this.createPositionStrategy();

    return {
      backdropClass: this.showBackdrop ? 'cdk-overlay-dark-backdrop' : undefined,
      disposeOnNavigation: true,
      hasBackdrop: this.showBackdrop,
      positionStrategy,
    };
  }

  private createPositionStrategy(): GlobalPositionStrategy {
    return this.overlay.position().global();
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

  public onResizeStart(element: HTMLDivElement) {
    this.initialBoundingRect = element.getBoundingClientRect();
    this.initialResizePosition = this.resizePosition$.value;
  }

  public onResizedRight(event: CdkDragMove, element: HTMLDivElement) {
    this.onResizeHorizontally(event, element);
  }

  public onResizedLeft(event: CdkDragMove, element: HTMLDivElement) {
    this.onResizeHorizontally(event, element, -1);

    if (this.initialResizePosition) {
      this.resizePosition$.next({...this.initialResizePosition, x: this.initialResizePosition.x + event.distance.x});
    }
  }

  private onResizeHorizontally(event: CdkDragMove, element: HTMLDivElement, multiplier: number = 1) {
    if (this.initialBoundingRect) {
      const newWidth = Math.max(this.initialBoundingRect.width + event.distance.x * multiplier, this.minWidth);
      if (newWidth !== this.initialBoundingRect.width) {
        this.setWidth(newWidth, element);
        this.checkHeight(newWidth, this.initialBoundingRect.height, element);
      }
    }
  }

  public onResizedBottom(event: CdkDragMove, element: HTMLDivElement) {
    this.onResizeVertically(event, element, 1);
  }

  public onResizedTop(event: CdkDragMove, element: HTMLDivElement) {
    this.onResizeVertically(event, element, -1);

    if (this.initialResizePosition) {
      this.resizePosition$.next({...this.initialResizePosition, y: this.initialResizePosition.y + event.distance.y});
    }
  }

  private onResizeVertically(event: CdkDragMove, element: HTMLDivElement, multiplier: number = 1) {
    if (this.initialBoundingRect) {
      const newHeight = Math.max(this.initialBoundingRect.height + event.distance.y * multiplier, this.minHeight);
      if (newHeight !== this.initialBoundingRect.height) {
        this.setHeight(newHeight, element);
        this.checkWidth(newHeight, this.initialBoundingRect.width, element);
      }
    }
  }

  private checkWidth(newHeight: number, width: number, element: HTMLDivElement) {
    if (!this.minSize) {
      return;
    }

    if (newHeight + width < this.minSize) {
      this.setWidth(this.minSize - newHeight, element);
    }
  }

  private checkHeight(newWidth: number, height: number, element: HTMLDivElement) {
    if (!this.minSize) {
      return;
    }

    if (newWidth + height < this.minSize) {
      this.setHeight(this.minSize - newWidth, element);
    }
  }

  private setHeight(height: number, element: HTMLDivElement) {
    this.renderer.setStyle(element, 'height', `${height}px`);
    this.renderer.setStyle(element.parentElement, 'height', `${height}px`);
  }

  private setWidth(width: number, element: HTMLDivElement) {
    this.renderer.setStyle(element, 'width', `${width}px`);
    this.renderer.setStyle(element.parentElement, 'width', `${width}px`);
  }

  public onResizeEnd(event: CdkDragEnd) {
    event.source.reset();
    this.initialBoundingRect = undefined;
  }

  public onDragEnd(event: CdkDragEnd) {
    this.resizePosition$.next({
      x: this.resizePosition$.value.x + event.distance.x,
      y: this.resizePosition$.value.y + event.distance.y,
    });
  }
}
