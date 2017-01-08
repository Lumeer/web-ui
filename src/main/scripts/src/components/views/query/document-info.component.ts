import {
  Component, trigger, state, style, transition, group, animate, Input, keyframes,
  ViewChildren, QueryList, ElementRef, Output, EventEmitter
} from '@angular/core';
import {Http} from '@angular/http';
@Component({
  selector: 'document-info',
  template: require('./document-info.component.html'),
  styles: [ require('./document-info.component.scss').toString() ],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(300, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})

export class DocumentInfoComponent {
  public activeIndexes: any[] = [];
  private openLinks: number = 2;
  private versionsVisible = false;
  private metadataVisible = false;
  @ViewChildren('linkInfo') private linksInfo: QueryList<ElementRef>;
  @Input() public document: any;
  @Output() public documentChange: any = new EventEmitter();

  constructor() {
    if (window.innerWidth <= 360) {
      this.openLinks = 1;
    }
  }

  public onMetadataToggleClick() {
    this.metadataVisible = !this.metadataVisible;
  }

  public onVersionsToggleClick() {
    this.versionsVisible = !this.versionsVisible;
  }

  public onRightsToggleClick() {}

  public onCloseClick() {
    this.document = undefined;
    this.documentChange.emit(undefined);
  }

  public onLinkClick(linkIndex) {
    if (this.activeIndexes.indexOf(linkIndex) !== -1) {
      this.activeIndexes.splice(this.activeIndexes.indexOf(linkIndex), 1);
    } else {
      if (this.activeIndexes.length === this.openLinks) {
        this.activeIndexes.pop();
      }
      this.activeIndexes.push(linkIndex);
    }
    setTimeout(() => this.updateLinksScroll());

  }

  private updateLinksScroll() {
    if (this.linksInfo) {
      this.linksInfo.toArray().forEach( (linkInfo: any) => {
        setTimeout(() => linkInfo.update());
      });
    }
  }

  public onEditLinksClick($event) {
    $event.stopPropagation();
    $event.preventDefault();
  }
}
