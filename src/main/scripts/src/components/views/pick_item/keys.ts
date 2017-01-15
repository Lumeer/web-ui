import {PipeTransform, Pipe} from '@angular/core';

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  public transform(value): any {
    if (!value) {
      return value;
    }

    let keys = [];
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        keys.push({key: key, value: value[key]});
      }
    }
    return keys;
  }
}
