import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {NavigationStart, Router} from '@angular/router';
import {VideoPlayerService} from './video-player.service';
import {filter, tap} from 'rxjs/operators';
import {AppState} from '../core/store/app.state';
import {Store} from '@ngrx/store';
import {VideosAction} from '../core/store/videos/videos.action';

declare let $: any;

@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPlayerComponent implements OnInit {
  private readonly playerId = 'videoPlayerModal';

  public open: boolean;

  private subscriptions = new Subscription();

  public constructor(
    private videoPlayerService: VideoPlayerService,
    private router: Router,
    private store: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToOpenPlayer());
    this.subscriptions.add(this.subscribeToClosePlayer());
  }

  private subscribeToOpenPlayer(): Subscription {
    return this.router.events
      .pipe(
        filter(event => !this.open && event instanceof NavigationStart),
        tap((event: NavigationStart) => this.publishVideos(event.url)),
        filter((event: NavigationStart) => event.url.includes('(video:'))
      )
      .subscribe(event => this.openPlayer());
  }

  private subscribeToClosePlayer(): Subscription {
    return this.router.events
      .pipe(
        filter(event => this.open && event instanceof NavigationStart),
        filter((event: NavigationStart) => !event.url.includes('(video:'))
      )
      .subscribe(event => this.closePlayer());
  }

  private openPlayer() {
    this.open = true;
    this.player().modal('show');
  }

  private closePlayer() {
    this.open = false;
    this.player().modal('hide');
  }

  public ngAfterViewInit() {
    this.player().on('hidden.bs.modal', () => {
      this.open = false;
      this.clearPlayerRoute();
    });
  }

  private clearPlayerRoute() {
    this.videoPlayerService.closePlayer();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private player(): any {
    return $(`#${this.playerId}`);
  }

  private publishVideos(url: string): void {
    //this.store.dispatch(new VideosAction.LoadVideo({id: 'etoqX2slVEw', apiKey: ''}));
    this.store.dispatch(
      new VideosAction.SetVideos({
        videos: [
          {
            id: 'etoqX2slVEw',
            summary: 'Lumeer in HR',
            description: 'See how Lumeer helps in HR',
            priority: 23,
            thumbnail: '',
          },
        ],
      })
    );
  }
}
