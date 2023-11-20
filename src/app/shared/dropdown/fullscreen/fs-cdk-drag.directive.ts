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
import {Directionality} from '@angular/cdk/bidi';
import {
  CDK_DRAG_CONFIG,
  CDK_DRAG_HANDLE,
  CDK_DRAG_PARENT,
  CDK_DROP_LIST,
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  DragDrop,
  DragDropConfig,
} from '@angular/cdk/drag-drop';
import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Inject,
  NgZone,
  Optional,
  Self,
  SkipSelf,
  ViewContainerRef,
} from '@angular/core';

const DRAG_HOST_CLASS = 'cdk-drag';

@Directive({
  selector: '[fsCdkDrag]',
  exportAs: 'fsCdkDrag',
  host: {
    class: DRAG_HOST_CLASS,
    '[class.cdk-drag-disabled]': 'disabled',
    '[class.cdk-drag-dragging]': '_dragRef.isDragging()',
  },
  providers: [{provide: CDK_DRAG_PARENT, useExisting: CdkDrag}],
})
export class FsCdkDragDirective extends CdkDrag {
  constructor(
    /** Element that the draggable is attached to. */
    public element: ElementRef<HTMLElement>,
    /** Droppable container that the draggable is a part of. */
    @Inject(CDK_DROP_LIST) @Optional() @SkipSelf() public dropContainer: CdkDropList,
    /**
     * @deprecated `_document` parameter no longer being used and will be removed.
     * @breaking-change 12.0.0
     */
    @Inject(DOCUMENT) _document: any,
    _ngZone: NgZone,
    _viewContainerRef: ViewContainerRef,
    @Optional() @Inject(CDK_DRAG_CONFIG) config: DragDropConfig,
    @Optional() _dir: Directionality,
    dragDrop: DragDrop,
    _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Self() @Inject(CDK_DRAG_HANDLE) _selfHandle?: CdkDragHandle,
    @Optional() @SkipSelf() @Inject(CDK_DRAG_PARENT) _parentDrag?: CdkDrag
  ) {
    super(
      element,
      null,
      document,
      _ngZone,
      _viewContainerRef,
      config,
      _dir,
      dragDrop,
      _changeDetectorRef,
      _selfHandle,
      _parentDrag
    );
  }
}
