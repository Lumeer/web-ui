import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';
import {Entry} from "./Entry";

@Component({
  selector: 'document-post-it',
  template: require('./document-post-it.component.html'),
  styles: [require('./document-post-it.component.scss').toString()]
})
export class DocumentPostItComponent implements OnInit {

  @Input() public document: any;
  @Output() private eventEmitter = new EventEmitter<any>();

  public entries:Entry[] = [];

  constructor(){}

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

  ngOnInit(): void {
    for(let key of Object.keys(this.document)) {
      let value = this.document[key];

      if(typeof value != "string" && typeof value[0] != "string") { // it is array of documents, we assume that there is just one
        let newValue = [];
        for(let nestedKey of Object.keys(value)) {
          newValue.push(new Entry(nestedKey, value[nestedKey], false));
        }
        this.entries.push(new Entry(key, newValue, true));
      }
      else {
        this.entries.push(new Entry(key, value, false));
      }
    }
  }

  clickedForDetail() {
    this.eventEmitter.emit(this.document);
  }

}
