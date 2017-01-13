import {Component, Input, OnInit, OnChanges} from '@angular/core';
import {Entry} from "./Entry";

@Component({
  selector: 'document-content',
  template: require('./document-content.component.html'),
  styles: [require('./document-content.component.scss').toString()]
})
export class DocumentContentComponent implements OnInit, OnChanges{

  @Input() public document:any;
  public entries:Entry[];

  constructor(){}

  ngOnChanges() : void{
    if(this.entries){
      this.initKeys();
    }
  }

  ngOnInit(): void {
    this.initKeys();
  }

  private initKeys(){
    this.entries = [];
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
        if(value.constructor===Array) {
          this.entries.push(new Entry(key, value.join(", "), false));
        }else{
          this.entries.push(new Entry(key, value, false));
        }
      }
    }
  }

}

