import {Pipe, PipeTransform} from '@angular/core';
import {PivotAttribute, PivotConfig} from '../../../../core/store/pivots/pivot';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {pivotAttributesAreSame} from '../util/pivot-util';

@Pipe({
  name: 'pivotHeaderSelectItems'
})
export class PivotHeaderSelectItemsPipe implements PipeTransform {

  public transform(selectItems: SelectItemModel[], config: PivotConfig, currentAttribute?: PivotAttribute): any {

    const restrictedAttributes = [...(config.rowAttributes || []), ...(config.columnAttributes || [])]
      .filter(attribute => !currentAttribute || !pivotAttributesAreSame(attribute, currentAttribute));

    return selectItems.filter(item => !restrictedAttributes.some(attribute => pivotAttributesAreSame(item.id as PivotAttribute, attribute)));
  }

}
