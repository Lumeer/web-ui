import {PipeTransform, Pipe} from '@angular/core';

@Pipe({name: 'metakeys'})
export class MetaKeysPipe implements PipeTransform {
  public transform(value): any {
    if (!value) {
      return value;
    }

    let keys = [];
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        if (!key.startsWith("_meta")) {
          keys.push({key: key, value: value[key]});
        }
      }
    }
    return keys;
  }
}
