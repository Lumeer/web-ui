import {Component, Input, OnInit, OnChanges} from '@angular/core';
import {Entry} from './entry-interface';
import * as _ from 'lodash';

@Component({
  selector: 'document-content',
  template: require('./document-content.component.html'),
  styles: [require('./document-content.component.scss').toString()]
})
export class DocumentContentComponent implements OnInit, OnChanges {

  @Input() public document: any;
  public entries: Entry[];

  public ngOnChanges(): void {
    if(this.entries) {
      this.initKeys();
    }
  }

  public ngOnInit(): void {
    this.initKeys();
  }

  public isNested(value) {
    return typeof(value) === 'object' && !value.hasOwnProperty('title');
  }

  public fetchKeys(value) {
    return Object.keys(value);
  }

  private initKeys() {
    console.log(this.document);
    this.entries = [];
    _.each(this.document, (value, key) => {
      if(typeof value !== 'string' && typeof value[0] !== 'string') {
        let newValue = _
          .reduce(value, (result, nestedValue, nestedKey) => [...result, new Entry(nestedKey, nestedValue, false)], []);
        this.entries = [...this.entries, new Entry(key, newValue, true)];
      } else {
        if(_.isArray(value)) {
          this.entries = [...this.entries, new Entry(key, value.join(', '), false)];
        } else {
          this.entries = [...this.entries, new Entry(key, value, false)];
        }
      }
    });
  }
}
