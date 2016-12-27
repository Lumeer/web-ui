import {Component, trigger, state, style, transition, animate, keyframes, Input} from '@angular/core';
import * as _ from 'lodash';
import {LocalStorage} from 'ng2-webstorage';

@Component({
  selector: 'document-preview',
  template: require('./document-preview.component.html'),
  styles: [ require('./document-preview.component.scss').toString() ],
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

export class DocumentPreviewComponent {
  public pickerVisible = false;
  public colors: string[];
  public icons: string[];
  @Input() public documents;
  @LocalStorage() public lastDocument;
  public newDocument: any = { links: []};
  public activeDocument: any;

  constructor() {
    this.initColors();
    this.initIcons();
  }

  public setIcon(icon) {
    this.newDocument.icon = icon;
  }

  public setColor(color) {
    this.newDocument.color = color;
  }

  public newDocumentInfo() {
    if (!this.newDocument.title) {
      return ;
    }
    if (!this.newDocument.color) {
      this.newDocument.color = 'white';
    }
    this.documents.push(_.cloneDeep(this.newDocument));
    this.newDocument = {
      links: []
    };
  }

  public setActiveDocument(document) {
    this.activeDocument = document;
    this.lastDocument = document;
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
