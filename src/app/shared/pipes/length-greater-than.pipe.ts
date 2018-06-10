import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lengthGreaterThan'
})
export class LengthGreaterThanPipe implements PipeTransform {

  public transform(value: {length: number}, threshold: number): boolean {
    return value && value.length && value.length > threshold;
  }

}
