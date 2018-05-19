import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'data'
})
export class DataPipe implements PipeTransform {

  public transform(entity: {data: any}, attributeId: string): any {
    return entity && entity.data ? entity.data[attributeId] || '' : '';
  }

}
