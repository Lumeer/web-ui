import {Pipe, PipeTransform} from '@angular/core';
import {AttributeModel} from '../../../../../core/store/collections/collection.model';
import {extractAttributeLastName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeLastName'
})
export class AttributeLastNamePipe implements PipeTransform {

  public transform(attribute: AttributeModel): string {
    return extractAttributeLastName(attribute.name);
  }

}
