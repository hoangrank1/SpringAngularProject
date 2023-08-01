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
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appState$!: Observable<AppState<CustomResponse | any>>;

  readonly DataState = DataState;
  readonly Status = Status;

  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse | any>(null);
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

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          let index = this.dataSubject.value?.data.servers?.findIndex((server: { id: number | undefined; }) =>  server.id === response.data.server?.id);
          let idx: number = Number(index);
          console.log(index);

          // this.dataSubject.value?.data.servers?[idx] = response.data.server;

          this.notifier.onDefault(response.message);
          this.filterSubject.next('');

          return { 
            dataState: DataState.LOADED_STATE, 
            appData: this.dataSubject.value 
          }
        }),
        startWith({ 
          dataState: DataState.LOADED_STATE, 
          appData: this.dataSubject.value 
        }),
        catchError((error: string) => {
          this.filterSubject.next('');
          this.notifier.onError(error);

          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);

          return { 
            dataState: DataState.LOADED_STATE, 
            appData: response 
          };
        }),
        startWith({ 
          dataState: DataState.LOADED_STATE, 
          appData: this.dataSubject.value 
        }),
        catchError((error: string) => {
          this.notifier.onError(error);

          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
      .pipe(
        map(response => {
          this.dataSubject.next({
            ...response, 
            data: { 
              servers: [
                response.data.server, 
                ...this.dataSubject.value.data.servers
              ] 
            } 
          });
          this.notifier.onDefault(response.message);

          document.getElementById('closeModal')?.click();
          
          this.isLoading.next(false);
          serverForm.resetForm({ status: this.Status.SERVER_DOWN });

          return { 
            dataState: DataState.LOADED_STATE, 
            appData: this.dataSubject.value 
          }
        }),
        startWith({ 
          dataState: DataState.LOADED_STATE, 
          appData: this.dataSubject.value 
        }),
        catchError((error: string) => {
          this.isLoading.next(false);
          this.notifier.onError(error);

          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
}
}