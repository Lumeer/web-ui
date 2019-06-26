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
  EventEmitter,
  Input,
  Output,
  ElementRef,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import {SelectItemModel} from '../select-item.model';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';

@Component({
  selector: 'select-item-dropdown',
  templateUrl: './select-item-dropdown.component.html',
  styleUrls: ['./select-item-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemDropdownComponent implements AfterViewInit {
  @Input()
  public origin: HTMLElement;

  @Input()
  public items: SelectItemModel[];

  @Input()
  public selectedId: any;

  @Input()
  public fitParent: boolean;

  @Output()
  public selectItem = new EventEmitter<SelectItemModel>();

  @ViewChild('selectItemDropdown', {static: true})
  public selectItemDropdown: TemplateRef<any>;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;

  constructor(private overlay: Overlay, private viewContainer: ViewContainerRef) {}

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.selectItemDropdown, this.viewContainer);
  }

  public onSelect(item: SelectItemModel) {
    this.close();
    this.selectItem.emit(item);
  }

  public open() {
    if (this.overlayRef) {
      return;
    }

    this.overlayRef = this.overlay.create(this.getOverlayConfig());
    this.overlayRef.attach(this.portal);
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.syncWidth();
  }

  private getOverlayConfig(): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.origin)
      .withLockedPosition()
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ]);

    return new OverlayConfig({
      disposeOnNavigation: true,
      positionStrategy: positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.syncWidth();
  }

  private syncWidth() {
    if (!this.overlayRef || !this.fitParent) {
      return;
    }

    const refRect = this.origin.getBoundingClientRect();
    this.overlayRef.updateSize({width: refRect.width});
  }

  public close() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
