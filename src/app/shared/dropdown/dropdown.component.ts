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

import {FlexibleConnectedPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  RendererStyleFlags2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {connectedPositionsMap, convertDropdownToConnectedPositions, DropdownPosition} from './dropdown-position';
import {BehaviorSubject, interval, Observable, Subscription} from 'rxjs';
import {deepObjectsEquals, preventEvent} from '../utils/common.utils';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public closeOnClickOutside = true;

  @Input()
  public closeOnClickOrigin: boolean;

  @Input()
  public showBackdrop = true;

  @Input()
  public fitParent: boolean;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public positions: DropdownPosition[] = [DropdownPosition.BottomStart];

  @Input()
  public minWidth: number;

  @Input()
  public maxWidth: number;

  @Input()
  public minHeight: number;

  @Input()
  public pushOnScreen = false;

  @Input()
  public static = true;

  @Output()
  public onClose = new EventEmitter();

  @Output()
  public onCloseByClickOutside = new EventEmitter();

  @Output()
  public positionChange = new EventEmitter<DropdownPosition>();

  @ViewChild('dropdown')
  public dropdown: TemplateRef<any>;

  public clickListener: any;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;
  private opened$ = new BehaviorSubject(false);

  private currentPosition: DropdownPosition;
  private positionSubscription: Subscription;
  private originSubscription: Subscription;

  constructor(
    private overlay: Overlay,
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2
  ) {}

  public get dropdownPosition(): DropdownPosition {
    return this.currentPosition;
  }

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.dropdown, this.viewContainer);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.minWidth || changes.minHeight || changes.maxWidth) {
      if (this.overlayRef) {
        this.overlayRef.updateSize({minWidth: this.minWidth, maxWidth: this.maxWidth, minHeight: this.minHeight});
        this.overlayRef.updatePosition();
      }
    }
  }

  public ngOnDestroy() {
    this.close();
    this.positionSubscription?.unsubscribe();
  }

  public open(offsetX?: number) {
    if (this.overlayRef) {
      return;
    }

    this.opened$.next(true);

    const overlayConfig = this.createOverlayConfig(offsetX);

    this.overlayRef = this.overlay.create(overlayConfig);
    this.overlayRef.attach(this.portal);

    if (this.closeOnClickOutside) {
      if (this.showBackdrop) {
        this.overlayRef.backdropClick().subscribe(() => this.close());
      } else {
        this.clickListener = event => this.checkClickOutside(event);
        const triggerEvent = this.closeOnClickOrigin ? 'click' : 'mousedown';
        setTimeout(() => document.addEventListener(triggerEvent, this.clickListener));
      }
    }

    this.syncSizes();
    this.subscribeOrigin();
    setTimeout(() => this.syncSizes());
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

  public clickedOutside(event: MouseEvent): boolean {
    const originElement = (<ElementRef>this.origin).nativeElement || <HTMLElement>this.origin;
    const clickedOnOrigin = originElement.contains(event.target as any);
    return (
      event.isTrusted &&
      this.overlayRef?.overlayElement &&
      !this.overlayRef.overlayElement.contains(event.target as any) &&
      ((clickedOnOrigin && this.closeOnClickOrigin) || !clickedOnOrigin)
    );
  }

  private checkClickOutside(event: MouseEvent) {
    if (this.clickedOutside(event)) {
      preventEvent(event);
      this.onCloseByClickOutside.emit();
      this.close();
    }
  }

  private createPositionStrategy(): FlexibleConnectedPositionStrategy {
    return this.overlay
      .position()
      .flexibleConnectedTo(this.origin)
      .withPush(this.pushOnScreen)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(true)
      .withViewportMargin(8)
      .withPositions(convertDropdownToConnectedPositions(this.positions));
  }

  private createOverlayConfig(offsetX?: number): OverlayConfig {
    let positionStrategy = this.createPositionStrategy();

    this.subscribePositionChange(positionStrategy);

    if (offsetX || offsetX === 0) {
      positionStrategy = positionStrategy.withDefaultOffsetX(offsetX);
    }

    return {
      backdropClass: this.showBackdrop ? 'cdk-overlay-transparent-backdrop' : undefined,
      disposeOnNavigation: true,
      hasBackdrop: this.showBackdrop,
      panelClass: ['position-absolute', 'w-max-content'],
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      maxWidth: this.maxWidth,
      positionStrategy,
    };
  }

  private subscribePositionChange(positionStrategy: FlexibleConnectedPositionStrategy) {
    this.positionSubscription?.unsubscribe();
    this.positionSubscription = positionStrategy.positionChanges.subscribe(positionChange => {
      const position = Object.entries(connectedPositionsMap).find(([, pair]) =>
        deepObjectsEquals(positionChange.connectionPair, pair)
      )?.[0];
      if (position) {
        this.currentPosition = <DropdownPosition>position;
        this.positionChange.next(this.currentPosition);
      }
    });
  }

  public close() {
    this.opened$.next(false);
    this.onClose.emit();
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    document.removeEventListener('click', this.clickListener);
    this.originSubscription?.unsubscribe();
  }

  public isOpen(): boolean {
    return this.opened$.value;
  }

  public isOpen$(): Observable<boolean> {
    return this.opened$.asObservable();
  }

  public updatePosition() {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
      this.syncSizes();
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.syncSizes();
  }

  private syncSizes() {
    this.syncMaxHeight();
    this.syncWidth();
  }

  private syncMaxHeight() {
    if (!this.static || !this.overlayRef?.overlayElement?.children.item(0)) {
      return;
    }

    const overlayElement = this.overlayRef.overlayElement;
    if (overlayElement.style?.top) {
      this.renderer.setStyle(
        overlayElement.children.item(0),
        'max-height',
        `calc(100vh - ${overlayElement.style.top})`,
        RendererStyleFlags2.Important
      );
    }
  }

  private syncWidth() {
    if (!this.overlayRef?.overlayElement || !this.fitParent) {
      return;
    }

    const clientRect = this.getOriginBoundingClientRect();
    if (clientRect.width !== this.overlayRef.overlayElement.offsetWidth) {
      this.overlayRef.updateSize({width: clientRect.width});
    }
  }

  private getOriginBoundingClientRect(): DOMRect {
    const element: HTMLElement = this.origin instanceof ElementRef ? this.origin.nativeElement : this.origin;
    return element.getBoundingClientRect();
  }
}
