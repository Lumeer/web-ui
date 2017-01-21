import {
  Component, Input, Output, EventEmitter, trigger, state, style, transition, animate,
  keyframes
} from '@angular/core';
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
  public newCollection: any = {};
  public pickerVisible: boolean = false;
  public placeholderTitle: string = 'Title name';

  @Output() public onNewDocument: EventEmitter<any> = new EventEmitter();
  @Output() public onNewCollection: EventEmitter<any> = new EventEmitter();
  @Output() public onShowCollection: EventEmitter<any> = new EventEmitter();

  constructor(public collectionService: CollectionService) {}

  public ngOnInit() {
    this.collectionService.getAllCollections();
  }

  public saveDocument(dataPayload) {
    this.onNewDocument.emit(dataPayload);
    this.newDocument = {};
  }

  public saveCollection(dataPayload) {
    this.onNewCollection.emit(dataPayload);
    this.newCollection = {};
  }

  public onCollectionChange(payload) {
    this.newDocument.collection = payload;
  }

  public showCollection(collection) {
    this.onShowCollection.emit(collection);
  }
}
