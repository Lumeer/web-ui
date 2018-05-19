import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'pixel'
})
export class PixelPipe implements PipeTransform {

  public transform(length: number): string {
    return `${length}px`;
  }

}
