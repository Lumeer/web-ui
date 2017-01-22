import {
  Component, Input, Output, EventEmitter, trigger, state, style, transition, animate,
  keyframes
} from '@angular/core';
import * as _ from 'lodash';
import {CollectionService} from '../../../services/collection.service';

@Component({
  selector: 'empty-result',
  template: require('./empty-result.component.html'),
  styles: [require('./empty-result.component.scss').toString()],
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

export class EmptyResultComponent {
  public newDocument: any = {links: []};
  public colors: string[];
  public icons: string[];
  public newCollection: any = {
  };
  public autocompleteOptions = {
    displayKey: 'name',
    keepAfterSubmit: true,
    model: ''
  };
  public pickerVisible: boolean = false;
  public placeholderTitle: string = 'Title name';

  @Output() public onNewDocument: EventEmitter<any> = new EventEmitter();
  @Output() public onNewCollection: EventEmitter<any> = new EventEmitter();
  @Output() public onShowCollection: EventEmitter<any> = new EventEmitter();

  constructor(public collectionService: CollectionService) {
    this.initColors();
    this.initIcons();
  }

  public ngOnInit() {
    this.collectionService.getAllCollections();
  }

  public saveDocument() {
    this.onNewDocument.emit(this.newDocument);
    this.newDocument = {};
  }

  public saveCollection(dataPayload) {
    this.collectionService.allCollections.push(this.newCollection);
    this.onNewCollection.emit(this.newCollection);
    this.newCollection = {
    };
  }

  public onCollectionChange(payload) {
    this.newDocument.collection = payload;
  }

  public showCollection(collection) {
    this.onShowCollection.emit(collection);
  }

  public setColor(color) {
    this.newCollection.iconColor = color;
  }

  public setIcon(icon) {
    this.newCollection.icon = icon;
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
