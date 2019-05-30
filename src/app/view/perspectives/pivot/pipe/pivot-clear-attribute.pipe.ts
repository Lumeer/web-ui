import {Pipe, PipeTransform} from '@angular/core';
import {PivotAttribute} from '../../../../core/store/pivots/pivot';

@Pipe({
  name: 'pivotClearAttribute'
})
export class PivotClearAttributePipe implements PipeTransform {

  public transform(attribute: PivotAttribute): PivotAttribute {
    if (!attribute) {
      return attribute;
    }
    return {
      attributeId: attribute.attributeId,
      resourceIndex: attribute.resourceIndex,
      resourceId: attribute.resourceId,
      resourceType: attribute.resourceType
    };
  }

}
