import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'colors'
})
export class ColorsPipe implements PipeTransform {

  public transform(entities: { color: string }[]): string[] {
    return entities.map(entity => entity.color);
  }

}
