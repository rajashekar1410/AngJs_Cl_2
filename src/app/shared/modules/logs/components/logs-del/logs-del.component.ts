import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
// import { concatMap, map } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ITrackLogsEvent, LogActionTypes } from '../../../user-tracking/models/track-logs';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { LogTypes } from '../../models/log-types';

@Component({
  selector: 'app-logs-del',
  templateUrl: './logs-del.component.html',
  styleUrls: ['./logs-del.component.scss']
})
export class LogsDelComponent implements OnInit, OnDestroy {

  constructor(
    public mdls: IetmModalService,
    private cs: CommonService,
    public modalRef: BsModalRef,
    private trackingService: UserTrackingService
  ) { }

  // inventory item
  logInfo = {
    id: -1,
  };

  logType: LogTypes = -1;

  triggerDel$ = new Subject();

  delItemSub$: Subscription = null;

  ngOnInit(): void {
  }

  deleteLogs() {
    if (this.logInfo.id >= 0) {
      this.delItemSub$ = this.cs.postData({ sourceid: 'list_rowdel', info: { query: 'logs', column: 'id', selids: [this.logInfo.id] } })
        /*.pipe(
          concatMap((res: any) => {
            const logEvent: ITrackLogsEvent = {
              event: LogActionTypes.TYPE_LOG_DELETED,
              data: {
                id: this.logInfo.id,
                logType: this.logType
              }
            };
            return this.trackingService.trackInventoryEvent({
              type: TrackingTypes.TYPE_LOGS,
              data: JSON.stringify(logEvent),
              uid: this.cs.user_session.id
            }).pipe(map(_ => res))
          })
        )*/
        .subscribe((data: any) => {
          if (data.status == 1) {
            //console.log(JSON.stringify(data));
            this.triggerDel$.next(data.status);
          }
        }, err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.');
        });
    } else {
      this.cs.openGrowl('', 'Status', 'Internal error.');
    }
  }


  ngOnDestroy() {
    this.delItemSub$?.unsubscribe();
  }

}
