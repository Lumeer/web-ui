import {Pipe, PipeTransform} from '@angular/core';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {LinkInstanceModel} from '../../../../../core/store/link-instances/link-instance.model';
import {TableSingleColumn} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'extractValue'
})
export class ExtractValuePipe implements PipeTransform {

  public transform(entity: DocumentModel | LinkInstanceModel, column: TableSingleColumn): string {
    if (entity && entity.data) {
      return entity.data[column.attributeId];
    }
    return '';
  }

}
