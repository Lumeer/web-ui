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

import {Component, ChangeDetectionStrategy, Input, AfterViewInit, ElementRef, Renderer2, HostListener, ViewChild} from '@angular/core';
import {KanbanColumn} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {SelectionHelper} from '../../../../../shared/document/post-it/util/selection-helper';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query';
import {Collection} from '../../../../../core/store/collections/collection';

@Component({
  selector: 'kanban-column',
  templateUrl: './kanban-column.component.html',
  styleUrls: ['./kanban-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent implements AfterViewInit {

  @ViewChild('cardWrapper')
  public cardWrapperElement: ElementRef;

  @Input()
  public column: KanbanColumn;

  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public perspectiveId: string;

  @Input()
  public selectionHelper: SelectionHelper;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  constructor(private element: ElementRef,
              private renderer: Renderer2,
  ) {
  }

  public trackByDocument(inde: number, document: DocumentModel) {
    return document.id;
  }

  public ngAfterViewInit() {
    this.computeMaxHeight();
  }

  @HostListener('window:resize')
  public onResize(): void {
    this.computeMaxHeight();
  }

  private computeMaxHeight() {
    const element = (this.element.nativeElement.parentElement || this.element.nativeElement);
    const rootHeight = element.offsetHeight;
    this.renderer.setStyle(this.cardWrapperElement.nativeElement, 'max-height', `${rootHeight}px`);
  }
}
