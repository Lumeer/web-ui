import { Pipe, PipeTransform } from '@angular/core';
import {AttributeModel} from '../../../../../core/store/collections/collection.model';
import {extractAttributeLastName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeNameChanged'
})
export class AttributeNameChangedPipe implements PipeTransform {

  public transform(attribute: AttributeModel, newLastName: string): boolean {
    return !attribute || !attribute.id || extractAttributeLastName(attribute.name) !== newLastName;
  }

}
