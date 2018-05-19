import {Pipe, PipeTransform} from '@angular/core';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {HtmlModifier, stripedBackground} from '../../../../../shared/utils/html-modifier';

export const DEFAULT_COLOR = '#ffffff';
export const DEFAULT_STRIPED_COLOR = '#eeeeee';

@Pipe({
  name: 'columnBackground'
})
export class ColumnBackgroundPipe implements PipeTransform {

  public transform(collection: CollectionModel, unsaved?: boolean): any {
    const color = collection ? HtmlModifier.shadeColor(collection.color, .5) : DEFAULT_COLOR;
    const stripeColor = collection ? HtmlModifier.shadeColor(color, .25) : DEFAULT_STRIPED_COLOR;

    if (unsaved) {
      return stripedBackground(color, stripeColor);
    }

    return color;
  }

}
