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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {MatMenuTrigger} from '@angular/material/menu';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {getTableElementFromInnerElement} from '../../../../../../core/store/tables/table.utils';

@Component({
  selector: 'table-link-info',
  templateUrl: './table-link-info.component.html',
  styleUrls: ['./table-link-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLinkInfoComponent implements OnChanges, AfterViewInit {
  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public collections: Collection[];

  @Input()
  public linkType: LinkType;

  @Input()
  public hidden: boolean;

  @Input()
  public switchingEnabled: boolean;

  @Input()
  public canManageView: boolean;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Output()
  public addLinkColumn = new EventEmitter();

  @Output()
  public switchParts = new EventEmitter();

  @Output()
  public removePart = new EventEmitter();

  @ViewChild('linkMenu', {static: true})
  public linkMenu: ElementRef;

  @ViewChild(MatMenuTrigger)
  public trigger: MatMenuTrigger;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hidden) {
      setTimeout(() => this.setTableLinkInfoWidthCssVariable());
    }
  }

  public ngAfterViewInit() {
    this.setTableLinkInfoWidthCssVariable();
  }

  private setTableLinkInfoWidthCssVariable() {
    const tableElement = getTableElementFromInnerElement(this.element.nativeElement, this.cursor.tableId);
    if (!tableElement) {
      return;
    }

    const width = this.linkMenu.nativeElement.clientWidth + 1;

    const linkInfoColumnWidth = tableElement.style.getPropertyValue('--link-info-column-width');
    const configuredWidth = parseFloat((linkInfoColumnWidth || '0px').slice(0, -2));

    if (width > configuredWidth) {
      tableElement.style.setProperty('--link-info-column-width', `${width}px`);
    }
  }

  public onContextMenu() {
    this.trigger.openMenu();
  }
}
