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
import {ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {getTableElementFromInnerElement} from '../../../../../../core/store/tables/table.utils';

@Component({
  selector: 'table-caption',
  templateUrl: './table-caption.component.html',
  styleUrls: ['./table-caption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCaptionComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkType: LinkType;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public hidden: boolean;

  public colors: string[];
  public icons: string[];

  constructor(private element: ElementRef<HTMLElement>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections && this.collections) {
      this.colors = this.collections.map(collection => collection.color);
      this.icons = this.collections.map(collection => collection.icon);
    }
    setTimeout(() => this.calculateCaptionHeight());
  }

  public calculateCaptionHeight() {
    const height = this.element.nativeElement.clientHeight;

    const tableElement = getTableElementFromInnerElement(this.element.nativeElement, this.cursor.tableId);

    if (tableElement) {
      const captionHeightValue = tableElement.style.getPropertyValue('--caption-height') || '';
      const captionHeight = Number(captionHeightValue.split('px')[0] || 0);

      if (height > captionHeight) {
        tableElement.style.setProperty('--caption-height', `${height}px`);
      }
    }
  }
}
