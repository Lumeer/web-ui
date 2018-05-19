import { Pipe, PipeTransform } from '@angular/core';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {findAttributeByName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeExist'
})
export class AttributeExistPipe implements PipeTransform {

  public transform(collection: CollectionModel, attributeName: string): boolean {
    if (collection) {
      return !!findAttributeByName(collection.attributes, attributeName);
    }
    return false;
  }

}
