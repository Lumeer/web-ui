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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {AffectedCellPipe} from './affected-cell.pipe';
import {AttributeExistPipe} from './attribute-exist.pipe';
import {AttributeLastNamePipe} from './attribute-last-name.pipe';
import {AttributeNameChangedPipe} from './attribute-name-changed.pipe';
import {AttributeNamePipe} from './attribute-name.pipe';
import {AttributeParentNamePipe} from './attribute-parent-name.pipe';
import {CellCollapsedPipe} from './cell-collapsed.pipe';
import {CollapsiblePipe} from './collapsible.pipe';
import {ColumnChildCursorPipe} from './column-child-cursor.pipe';
import {ColumnCursorPipe} from './column-cursor.pipe';
import {ColumnHeightPipe} from './column-height.pipe';
import {ColumnWidthPipe} from './column-width.pipe';
import {CursorEqualsPipe} from './cursor-equals.pipe';
import {DataCellDocumentPipe} from './data-cell-document.pipe';
import {DataCellLinkInstancePipe} from './data-cell-link-instance.pipe';
import {DataPipe} from './data.pipe';
import {DocumentHintColumnsPipe} from './document-hint-columns.pipe';
import {DocumentHintsOffsetPipe} from './document-hints-offset.pipe';
import {EntityCreatedPipe} from './entity-created.pipe';
import {ExpandablePipe} from './expandable.pipe';
import {ExtractValuePipe} from './extract-value.pipe';
import {HeaderHeightPipe} from './header-height.pipe';
import {IsCompoundColumnPipe} from './is-compound-column.pipe';
import {IsFirstPartPipe} from './is-first-part.pipe';
import {IsFirstRowPipe} from './is-first-row.pipe';
import {IsHiddenColumnPipe} from './is-hidden-column.pipe';
import {IsLastPartPipe} from './is-last-part.pipe';
import {LastColumnPipe} from './last-column.pipe';
import {LinkedDocumentIdsPipe} from './linked-document-ids.pipe';
import {MaxPartsPipe} from './max-parts.pipe';
import {NextPartCursorPipe} from './next-part-cursor.pipe';
import {NextRowCursorPipe} from './next-row-cursor.pipe';
import {PartCursorPipe} from './part-cursor.pipe';
import {PartWidthPipe} from './part-width.pipe';
import {PartPipe} from './part.pipe';
import {PreviousLinkedRowPipe} from './previous-linked-row.pipe';
import {ResizeEdgesPipe} from './resize-edges.pipe';
import {ResizeValidatePipe} from './resize-validate.pipe';
import {RowPositionTopPipe} from './row-position-top.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DataPipe,
    EntityCreatedPipe,
    IsFirstPartPipe,
    IsLastPartPipe,
    NextPartCursorPipe,
    NextRowCursorPipe,
    ExpandablePipe,
    CollapsiblePipe,
    PartWidthPipe,
    PartCursorPipe,
    MaxPartsPipe,
    ColumnChildCursorPipe,
    HeaderHeightPipe,
    IsCompoundColumnPipe,
    IsHiddenColumnPipe,
    AttributeLastNamePipe,
    ColumnWidthPipe,
    ColumnCursorPipe,
    ColumnHeightPipe,
    ResizeEdgesPipe,
    PartPipe,
    AttributeNameChangedPipe,
    AttributeNamePipe,
    AttributeParentNamePipe,
    AttributeExistPipe,
    IsFirstRowPipe,
    CursorEqualsPipe,
    ExtractValuePipe,
    AffectedCellPipe,
    ResizeValidatePipe,
    DocumentHintColumnsPipe,
    PreviousLinkedRowPipe,
    LinkedDocumentIdsPipe,
    RowPositionTopPipe,
    DataCellDocumentPipe,
    DataCellLinkInstancePipe,
    CellCollapsedPipe,
    DocumentHintsOffsetPipe,
    LastColumnPipe,
  ],
  exports: [
    DataPipe,
    EntityCreatedPipe,
    IsFirstPartPipe,
    IsLastPartPipe,
    NextPartCursorPipe,
    NextRowCursorPipe,
    ExpandablePipe,
    CollapsiblePipe,
    PartWidthPipe,
    PartCursorPipe,
    MaxPartsPipe,
    ColumnChildCursorPipe,
    HeaderHeightPipe,
    IsCompoundColumnPipe,
    IsHiddenColumnPipe,
    AttributeLastNamePipe,
    ColumnWidthPipe,
    ColumnCursorPipe,
    ColumnHeightPipe,
    ResizeEdgesPipe,
    PartPipe,
    AttributeNameChangedPipe,
    AttributeNamePipe,
    AttributeParentNamePipe,
    AttributeExistPipe,
    IsFirstRowPipe,
    CursorEqualsPipe,
    ExtractValuePipe,
    AffectedCellPipe,
    ResizeValidatePipe,
    DocumentHintColumnsPipe,
    PreviousLinkedRowPipe,
    LinkedDocumentIdsPipe,
    RowPositionTopPipe,
    DataCellDocumentPipe,
    DataCellLinkInstancePipe,
    CellCollapsedPipe,
    DocumentHintsOffsetPipe,
    LastColumnPipe,
  ],
  providers: [AttributeNameChangedPipe],
})
export class TablePipesModule {}
