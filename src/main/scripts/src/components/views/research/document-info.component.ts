import {
  Component, trigger, state, style, transition, animate, Input, keyframes,
  ViewChildren, QueryList, ElementRef, Output, EventEmitter
} from '@angular/core';
import {DocumentService} from '../../../services/document.service';
import {Router, ActivatedRoute} from '@angular/router';

const LINK_ID = 'pick_item';

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

  constructor(private documentService: DocumentService,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
    if (window.innerWidth <= 360) {
      this.openLinks = 1;
    }
  }

  public onVersionsToggleClick() {
    this.versionsVisible = !this.versionsVisible;
    if(!this.document.versions) {
      this.documentService.fetchDocumentVersions();
    }
  }

  public onRightsToggleClick() {
    console.log('toggle click');
  }

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
    this.documentService.fetchDocumentDetailFromId(10);
    this.documentService.fetchFilterResultsFromFilter({});
    const parentData: any = this.activatedRoute.parent.snapshot.data;
    this.router.navigate([`/${parentData.id}`, LINK_ID]);
    if ($event) {
      $event.stopPropagation();
      $event.preventDefault();
    }
  }
}
