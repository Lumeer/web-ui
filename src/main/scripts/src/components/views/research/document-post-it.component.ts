import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';
import {Entry} from './entry-interface';
import * as _ from 'lodash';

@Component({
  selector: 'document-post-it',
  template: require('./document-post-it.component.html'),
  styles: [require('./document-post-it.component.scss').toString()]
})
export class DocumentPostItComponent implements OnInit {

  @Input() public document: any;
  @Output() private eventEmitter = new EventEmitter<any>();

  public entries: Entry[] = [];

  // ngOnInit(): void {
  //   this.keys = Object.keys(this.document);
  //   for(let i = 0; i < this.keys.length; i++) {
  //     var value = this.document[this.keys[i]];
  //
  //     if(typeof value != "string" && typeof value[0] != "string") { // it is array of documents
  //         this.values.push(JSON.stringify(value));
  //     }
  //     else {
  //       this.values.push(value);
  //     }
  //   }
  // }

  public ngOnInit(): void {
    _.each(this.document, (value, key) => {
      if(typeof value !== 'string' && typeof value[0] !== 'string') {
        let newValue = _
          .reduce(value, (result, nestedValue, nestedKey) => [...result, new Entry(nestedKey, nestedValue, false)], []);
        this.entries = [...this.entries, new Entry(key, newValue, true)];
      } else {
        this.entries = [...this.entries, new Entry(key, value, false)];
      }
    });
  }

  public clickedForDetail() {
    this.eventEmitter.emit(this.document);
  }

}
