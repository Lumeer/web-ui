import {Component, trigger, state, style, transition, animate, keyframes, Input} from '@angular/core';
import * as _ from 'lodash';
import {LocalStorage} from 'ng2-webstorage';
import {DocumentService} from '../../../services/document.service';

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
  @Input() public documents;
  @LocalStorage() public lastDocument;
  public newDocument: any = {links: []};
  public activeDocument: any;

  constructor(private documentService: DocumentService) {
    this.initColors();
    this.initIcons();
  }


  /*  public newDocumentInfo() {
   if (!this.newDocument.title) {
   return;
   }
   if (!this.newDocument.color) {
   this.newDocument.color = 'white';
   }
   // this.documents.push(_.cloneDeep(this.newDocument)); // commented out because it shows error
   this.newDocument = {
   links: []
   };
   }*/

  /* public setActiveDocument(document) {
   this.activeDocument = document;
   this.documentService.setActiveDocument(document);
   }*/

  public setIcon(icon) {
    this.newDocument.icon = icon;
  }

  public setColor(color) {
    this.newDocument.color = color;
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
