import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'icons'
})
export class IconsPipe implements PipeTransform {

  public transform(entities: { icon: string }[]): string[] {
    return entities.map(entity => entity.icon);
  }

}
