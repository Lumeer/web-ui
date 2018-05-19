import {Pipe, PipeTransform} from '@angular/core';
import {AttributeModel} from '../../../../../core/store/collections/collection.model';
import {extractAttributeParentName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeName'
})
export class AttributeNamePipe implements PipeTransform {

  public transform(attribute: AttributeModel, newLastName: string): any {
    if (!attribute) {
      return '';
    }

    const parentName = extractAttributeParentName(attribute.name);
    if (parentName) {
      return `${parentName}.${newLastName}`;
    }

    return newLastName;
  }

}
