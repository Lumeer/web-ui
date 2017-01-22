import {Component, trigger, state, style, transition, animate, keyframes, Input} from '@angular/core';
import * as _ from 'lodash';
import {LocalStorage} from 'ng2-webstorage';
import {DocumentService} from '../../../services/document.service';
import {DocumentInfoService} from '../../../services/document-info.service';
import {QueryTagService} from '../../../services/query-tags.service';

@Component({
  selector: 'document-preview',
  template: require('./document-preview.component.html'),
  styles: [require('./document-preview.component.scss').toString()],
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
  @Input() public documents;
  @LocalStorage() public lastDocument;
  public newDocument: any = {links: []};
  public activeDocument: any;
  public source: any[];
  private autocompleteOptions = {
    displayKey: 'text',
    keepAfterSubmit: true,
    model: ''
  };

  constructor(private documentService: DocumentService, private queryService: QueryTagService) {
  }

  public setIcon(icon) {
    this.newDocument.icon = icon;
  }

  public setColor(color) {
    this.newDocument.color = color;
  }

  public newDocumentInfo() {
    if (!this.newDocument.title) {
      return;
    }
    if (!this.newDocument.color) {
      this.newDocument.color = 'white';
    }
    this.documents.push(_.cloneDeep(this.newDocument));
    this.newDocument = {
      links: [],
      collection: ''
    };
    this.autocompleteOptions.model = '';
  }

  public setActiveDocument(document) {
    this.activeDocument = document;
    this.documentService.setActiveDocument(document);
  }

  public onCollectionChange(payload) {
    this.newDocument.collection = payload;
  }

  public ngOnInit() {
    this.fetchCollections();
  }

  private fetchCollections() {
    //TODO: Send active filter with request to fetch correct collections (for autocomplete)
    this.queryService.fetchCollections()
      .subscribe(collections => {
        this.source = collections;
      });
  }
}
