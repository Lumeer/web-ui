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
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {convertDropdownToConnectedPositions, DropdownPosition} from './dropdown-position';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public closeOnClickOutside = true;

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
  public minHeight: number;

  @Input()
  public pushOnScreen = false;

  @Output()
  public onClose = new EventEmitter();

  @ViewChild('dropdown', {static: false})
  public dropdown: TemplateRef<any>;

  public clickListener: any;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;

  constructor(private overlay: Overlay, private viewContainer: ViewContainerRef) {}

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.dropdown, this.viewContainer);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.minWidth || changes.minHeight) {
      this.overlayRef && this.overlayRef.updateSize({minWidth: this.minWidth, minHeight: this.minHeight});
    }
  }

  public ngOnDestroy() {
    this.close();
  }

  public open(offsetX?: number) {
    if (this.overlayRef) {
      return;
    }

    const overlayConfig = this.createOverlayConfig(offsetX);

    this.overlayRef = this.overlay.create(overlayConfig);
    this.overlayRef.attach(this.portal);

    if (this.closeOnClickOutside) {
      if (this.showBackdrop) {
        this.overlayRef.backdropClick().subscribe(() => this.close());
      } else {
        this.clickListener = event => this.checkClickOutside(event);
        setTimeout(() => document.addEventListener('click', this.clickListener));
      }
    }

    this.syncWidth();
  }

  public checkClickOutside(event: MouseEvent) {
    if (
      this.overlayRef &&
      this.overlayRef.overlayElement &&
      !this.overlayRef.overlayElement.contains(event.target as any)
    ) {
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
      positionStrategy,
    };
  }

  public close() {
    this.onClose.emit();
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    document.removeEventListener('click', this.clickListener);
  }

  public isOpen(): boolean {
    return !!this.overlayRef;
  }

  public updatePosition() {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.syncWidth();
  }

  private syncWidth() {
    if (!this.overlayRef || !this.fitParent) {
      return;
    }

    const clientRect = this.getOriginBoundingClientRect();
    this.overlayRef.updateSize({width: clientRect.width});
  }

  private getOriginBoundingClientRect(): DOMRect | ClientRect {
    const element: HTMLElement = this.origin instanceof ElementRef ? this.origin.nativeElement : this.origin;
    return element.getBoundingClientRect();
  }
}
