import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'document-post-it',
  template: require('./document-post-it.component.html'),
  styles: [require('./document-post-it.component.scss').toString()]
})
export class DocumentPostItComponent implements OnInit {

  @Input() public document: any;
  @Output() private eventEmitter = new EventEmitter<any>();

  private entries:Entry[] = [];

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
      var value = this.document[key];

      if(typeof value != "string" && typeof value[0] != "string") { // it is array of documents, we assume that there is just one
        var newValue = [];
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

class Entry {

  private key: String;
  private value: any;
  private nested: boolean;

  constructor(key:string, value:any, nested:boolean) {
    this.key = key;
    this.value = value;
    this.nested = nested;
  }
}
