import {Pipe, PipeTransform} from '@angular/core';
import {perspectiveIconsMap} from '../../view/perspectives/perspective';

@Pipe({
  name: 'perspectiveIcon'
})
export class PerspectiveIconPipe implements PipeTransform {

  public transform(perspective: string): string {
    return perspectiveIconsMap[perspective] || '';
  }

}
