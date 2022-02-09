import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ITrackingData } from '../../models/tracking-data';

@Injectable({
  providedIn: 'root'
})
export class UserTrackingService {

  constructor(
    private cs: CommonService
  ) { }

  trackPageAccess(data: ITrackingData) {
    return this._track(data);
  }

  trackPrintPage(data: ITrackingData) {
    return this._track(data);
  }

  trackGlobalSearch(data: ITrackingData) {
    if(data.gs_query?.length > 0)
      return this._track(data);
    return of(1);
  }

  trackPasswordChange(data: ITrackingData) {
    return this._track(data);
  }

  trackSQueChange(data: ITrackingData) {
    return this._track(data);
  }

  trackBookmarkEvent(data: ITrackingData) {
    return this._track(data);
  }

  trackAnnotationEvent(data: ITrackingData) {
    return this._track(data);
  }

  trackUserEvent(data: ITrackingData) {
    return this._track(data);
  }

  trackGlossaryEvent(data: ITrackingData) {
    return this._track(data);
  }

  trackInventoryEvent(data: ITrackingData) {
    return this._track(data);
  }
  
  trackLogsEvent(data: ITrackingData) {
    return this._track(data);
  }

  _track(data) {
    return this.cs.postData<any>({
      sourceid: 'listmgr',
      info: {
        tdata: data,
        pdata: {
          id: 'id',
          value: ''
        },
        query: 'user_activity'
      }
    });
  }
}
