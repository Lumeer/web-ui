import {Pipe, PipeTransform} from '@angular/core';
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {AttributesResource} from '../../../../core/model/resource';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {cleanPivotAttribute} from '../util/pivot-util';
import {findAttribute} from '../../../../core/store/collections/collection.util';

@Pipe({
  name: 'pivotAttributeSelectItem'
})
export class PivotAttributeSelectItemPipe implements PipeTransform {

  public transform(pivotAttribute: PivotRowColumnAttribute, attributesResources: AttributesResource[]): SelectItemModel {
    const resource = attributesResources[pivotAttribute.resourceIndex];
    if (!resource || pivotAttribute.resourceId !== resource.id) {
      return null;
    }

    const cleanedAttribute = cleanPivotAttribute(pivotAttribute);
    if (<Collection>resource) {
      const collection = resource as Collection;
      const attribute = findAttribute(collection.attributes, pivotAttribute.attributeId);
      return attribute && {id: cleanedAttribute, value: attribute.name, icons: [collection.icon], iconColors: [collection.color]};
    } else if (<LinkType>resource) {
      const linkType = resource as LinkType;
      const attribute = findAttribute(linkType.attributes, pivotAttribute.attributeId);
      return attribute && linkType.collections && linkType.collections.length === 2 &&
        {
          id: cleanedAttribute, value: attribute.name,
          icons: [linkType.collections[0].icon, linkType.collections[1].icon],
          iconColors: [linkType.collections[1].color, linkType.collections[1].color],
        }
    }


    return null;
  }

}
