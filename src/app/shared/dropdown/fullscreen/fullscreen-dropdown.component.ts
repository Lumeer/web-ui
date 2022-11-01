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
  Renderer2,
  ViewChild,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import {GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {CdkDrag, CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject, interval, Observable, Subscription} from 'rxjs';
import {convertRemToPixels} from '../../utils/html-modifier';
import {ModalData} from '../../../core/model/modal-data';
import {isNotNullOrUndefined} from '../../utils/common.utils';

const initialMargin = 3;

@Component({
  selector: 'fullscreen-dropdown',
  templateUrl: './fullscreen-dropdown.component.html',
  styleUrls: ['./fullscreen-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CdkDrag],
})
export class FullscreenDropdownComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public data: ModalData;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public showBackdrop = true;

  @Input()
  public minHeight: number = 100;

  @Input()
  public minWidth: number = 100;

  @Input()
  public minSize: number;

  @ViewChild('dropdown')
  public portal: TemplatePortal;

  @Output()
  public dataChange = new EventEmitter<ModalData>();

  private overlayRef: OverlayRef;

  private initialBoundingRect: DOMRect;
  private initialResizePosition: {x: number; y: number};
  private positionSubscription: Subscription;

  public currentWidth: number;
  public currentHeight: number;

  public opened$ = new BehaviorSubject(false);
  public resizePosition$ = new BehaviorSubject({
    x: convertRemToPixels(initialMargin),
    y: convertRemToPixels(initialMargin),
  });

  constructor(private overlay: Overlay, private renderer: Renderer2) {}

  public ngOnInit() {
    this.currentWidth = this.currentWidth || this.initialWidth();
    this.currentHeight = this.currentHeight || this.initialHeight();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      this.currentHeight = this.data?.relativeHeight || this.initialHeight();
      this.currentWidth = this.data?.relativeWidth || this.initialWidth();

      this.checkPosition();
    }
  }

  private checkPosition() {
    if (isNotNullOrUndefined(this.data?.xRelative) && isNotNullOrUndefined(this.data?.yRelative)) {
      this.resizePosition$.next({
        x: (this.data.xRelative * this.windowWidth) / 100,
        y: (this.data.yRelative * this.windowHeight) / 100,
      });
    } else if (isNotNullOrUndefined(this.data?.x) && isNotNullOrUndefined(this.data?.y)) {
      this.checkLegacyPosition();
    }
  }

  private checkLegacyPosition() {
    const widthPx = (this.currentWidth * this.windowWidth) / 100;
    const heightPx = (this.currentHeight * this.windowHeight) / 100;
    this.resizePosition$.next({
      x: Math.min(this.data.x, this.windowWidth - widthPx),
      y: Math.min(this.data.y, this.windowHeight - heightPx),
    });
  }

  public open() {
    if (this.overlayRef) {
      return;
    }

    this.opened$.next(true);

    const overlayConfig = this.createOverlayConfig();

    this.overlayRef = this.overlay.create(overlayConfig);
    this.overlayRef.attach(this.portal);
    this.overlayRef.backdropClick().subscribe(() => this.close());

    this.renderer.setStyle(this.overlayRef.overlayElement, 'height', `${this.currentHeight}vh`);
    this.renderer.setStyle(this.overlayRef.overlayElement, 'width', `${this.currentWidth}vw`);

    this.subscribeOrigin();
  }

  private subscribeOrigin() {
    this.positionSubscription?.unsubscribe();
    this.positionSubscription = interval(500).subscribe(() => {
      const element = (<ElementRef>this.origin)?.nativeElement || (this.origin as HTMLElement);
      if (!document.contains(element)) {
        this.close();
      }
    });
  }

  private createOverlayConfig(): OverlayConfig {
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
      const newWidth = Math.min(
        Math.max(this.initialBoundingRect.width + event.distance.x * multiplier, this.minWidth),
        this.currentMaxWidthPx()
      );
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
      const newHeight = Math.min(
        Math.max(this.initialBoundingRect.height + event.distance.y * multiplier, this.minHeight),
        this.currentMaxHeightPx()
      );
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
    this.currentHeight = (height / this.windowHeight) * 100;
    this.renderer.setStyle(element, 'height', `${this.currentHeight}vh`);
    this.renderer.setStyle(element.parentElement, 'height', `${this.currentHeight}vh`);
  }

  private setWidth(width: number, element: HTMLDivElement) {
    this.currentWidth = (width / this.windowWidth) * 100;
    this.renderer.setStyle(element, 'width', `${this.currentWidth}vw`);
    this.renderer.setStyle(element.parentElement, 'width', `${this.currentWidth}vw`);
  }

  public onResizeEnd(event: CdkDragEnd) {
    event.source.reset();
    this.initialBoundingRect = undefined;

    this.emitDataChange();
  }

  public onDragEnd(event: CdkDragEnd) {
    this.resizePosition$.next({
      x: Math.max(Math.min(this.resizePosition$.value.x + event.distance.x, this.currentMaxXOffsetPx()), 0),
      y: Math.max(Math.min(this.resizePosition$.value.y + event.distance.y, this.currentMaxYOffsetPx()), 0),
    });

    this.emitDataChange();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    if (isNotNullOrUndefined(this.data?.x) && isNotNullOrUndefined(this.data?.y)) {
      this.checkLegacyPosition();
    }
  }

  private emitDataChange() {
    this.dataChange.emit({
      ...this.resizePosition$.value,
      ...this.getRelativePosition(),
      relativeHeight: this.currentHeight,
      relativeWidth: this.currentWidth,
    });
  }

  private getRelativePosition(): {xRelative: number; yRelative: number} {
    const {x, y} = this.resizePosition$.value;
    return {
      xRelative: (x / this.windowWidth) * 100,
      yRelative: (y / this.windowHeight) * 100,
    };
  }

  private initialWidth(): number {
    return ((this.windowWidth - convertRemToPixels(initialMargin * 2)) / this.windowWidth) * 100;
  }

  private initialHeight(): number {
    return ((this.windowHeight - convertRemToPixels(initialMargin * 2)) / this.windowHeight) * 100;
  }

  private currentMaxWidthPx(): number {
    return this.windowWidth - this.resizePosition$.value.x;
  }

  private currentMaxHeightPx(): number {
    return this.windowHeight - this.resizePosition$.value.y;
  }

  private currentMaxXOffsetPx(): number {
    return this.windowWidth - (this.currentWidth / 100) * this.windowWidth;
  }

  private currentMaxYOffsetPx(): number {
    return this.windowHeight - (this.currentHeight / 100) * this.windowHeight;
  }

  private get windowWidth(): number {
    return window.innerWidth;
  }

  private get windowHeight(): number {
    return window.innerHeight;
  }

  public ngOnDestroy() {
    this.close();
    this.positionSubscription?.unsubscribe();
  }
}
