import {Pipe, PipeTransform} from '@angular/core';
import {AttributeModel} from '../../../../../core/store/collections/collection.model';
import {extractAttributeParentName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeParentName'
})
export class AttributeParentNamePipe implements PipeTransform {

  public transform(attribute: AttributeModel): string {
    return extractAttributeParentName(attribute.name);
  }

}
