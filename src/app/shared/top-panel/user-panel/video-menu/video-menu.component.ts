import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {VideoModel} from '../../../../core/store/videos/video.model';
import {selectVideosByPriority} from '../../../../core/store/videos/videos.state';
import {VideoPlayerService} from '../../../../video-player/video-player.service';

@Component({
  selector: 'video-menu',
  templateUrl: './video-menu.component.html',
  styleUrls: ['./video-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoMenuComponent implements OnInit {
  public videos$: Observable<VideoModel[]>;

  constructor(private store: Store<AppState>, private videoPlayerService: VideoPlayerService) {}

  public ngOnInit(): void {
    this.videos$ = this.store.pipe(select(selectVideosByPriority));
  }

  public openPlayer(id: string): void {
    this.videoPlayerService.openPlayer(id);
  }
}
