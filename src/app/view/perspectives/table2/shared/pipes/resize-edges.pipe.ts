import { Pipe, PipeTransform } from '@angular/core';
import {Edges} from 'angular-resizable-element';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableCompoundColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {hasLastTableColumnChildHidden, isLastTableColumnChild} from '../../../../../core/store/tables/table.utils';

@Pipe({
  name: 'resizeEdges'
})
export class ResizeEdgesPipe implements PipeTransform {

  public transform(column: TableCompoundColumn, table: TableModel, cursor: TableHeaderCursor): Edges {
    const part = table.parts[cursor.partIndex];
    const isLastChild = isLastTableColumnChild(part.columns, cursor.columnPath);
    const hasLastChildHidden = hasLastTableColumnChildHidden(column);
    return isLastChild || hasLastChildHidden ? {} : {right: true};
  }

}
