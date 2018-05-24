import {Pipe, PipeTransform} from '@angular/core';

import {HtmlModifier} from '../utils/html-modifier';

@Pipe({
  name: 'lightenColor'
})
export class LightenColorPipe implements PipeTransform {

  public transform(color: string, percent: number): string {
    return HtmlModifier.shadeColor(color, percent);
  }

}
