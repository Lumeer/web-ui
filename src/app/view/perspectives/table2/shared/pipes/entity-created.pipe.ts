import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'entityCreated'
})
export class EntityCreatedPipe implements PipeTransform {

  public transform(entity: {id: any}): boolean {
    return entity && entity.id;
  }

}
