import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NotificationService } from './service/notification.service';
import { ServerService } from './service/server.service';
import { AppState } from './interface/app-state';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { Server } from './interface/server';
import { CustomResponse } from './interface/custom-response';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>> | undefined;

  readonly DataState = DataState;
  readonly Status = Status;

  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse | null>(null);
  private isLoading = new BehaviorSubject<boolean>(false);

  filterStatus$ = this.filterSubject.asObservable();
  isLoading$ = this.isLoading.asObservable();

  constructor(
    private serverService: ServerService, 
    private notifier: NotificationService
  ) { }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          this.dataSubject.next(response);

          return { 
            dataState: DataState.LOADED_STATE, 
            appData: { 
              ...response, 
              data: { 
                servers: response.data.servers?.reverse() 
              } 
            } 
          }
        }),
        startWith({ 
          dataState: DataState.LOADING_STATE
        }),
        catchError((error: string) => {
          this.notifier.onError(error);

          return of({ dataState: DataState.ERROR_STATE, error }); // datatype: appstate
        }),
      );
  }
}