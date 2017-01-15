import {Component, trigger, state, style, transition, animate, keyframes, Input} from '@angular/core';
import * as _ from 'lodash';
import {LocalStorage} from 'ng2-webstorage';
import {DocumentService} from '../../../services/document.service';
import {CollectionService} from "../../../services/collection.service";

@Component({
  selector: 'collection-add',
  template: require('./collection-add.component.html'),
  styles: [require('./collection-add.component.scss').toString()],
  animations: [
    trigger('animateVisible', [
      state('in', style({height: '*', width: '*', opacity: 1})),
      transition('void => *', [
        animate(200, keyframes([
          style({height: 0, width: 0, opacity: 0, offset: 0}),
          style({height: '*', width: '*', opacity: 1, offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', width: '*', opacity: 1, offset: 0}),
          style({height: 0, width: 0, opacity: 0, offset: 1})
        ]))
      ])
    ])
  ]
})

export class CollectionAddComponent {

  public pickerVisible = false;
  public colors: string[];
  public icons: string[];

  @Input() public collections: any[];
  @LocalStorage() public lastDocument;

  public newCollection: any = {links: []};
  public activeCollection: any;

  public placeholderTitle: string;

  constructor(private collectionService: CollectionService) {
    this.initColors();
    this.initIcons();
    this.placeholderTitle = "New collection title";
  }

  public newCollectionInfo() {
    if (!this.newCollection.title || this.newCollection.title.trim() == "") {
      console.log("empty");

      this.placeholderTitle = "EMPTY title!";
      this.newCollection.title = "";
    } else {
      console.log("filled");

      this.placeholderTitle = "New collection title";

      if (!this.newCollection.color) {
        this.newCollection.color = 'white';
      }

      this.newCollection = {
        links: []
      };

      // TODO: add new collection sheet
    }
  }

  /* public setActiveDocument(document) {
   this.activeDocument = document;
   this.documentService.setActiveDocument(document);
   }*/


  public setIcon(icon) {
    this.newCollection.icon = icon;
  }

  public setColor(color) {
    this.newCollection.color = color;
  }

  private initColors() {
    this.colors = [
      '#c7254e',
      '#18BC9C',
      '#3498DB',
      '#F39C12',
      '#E74C3C'
    ];
  }

  private initIcons() {
    this.icons = [
      'fa-user-circle-o',
      'fa-dot-circle-o',
      'fa-snowflake-o',
      'fa-superpowers',
      'fa-eye-slash'
    ];
  }
}
