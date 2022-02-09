import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { IDatePickerConfig, ECalendarValue } from 'ng2-date-picker';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ITrackLogsEvent, LogActionTypes } from '../../../user-tracking/models/track-logs';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { LogTypes } from '../../models/log-types';


@Component({
  selector: 'app-logs-sensor-act',
  templateUrl: './logs-sensor-act.component.html',
  styleUrls: ['./logs-sensor-act.component.scss']
})
export class LogsSensorActComponent implements OnInit {

  constructor(
    private cs: CommonService,
    private trackingService: UserTrackingService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode: LogActionTypes = -1;

  logsForm: FormGroup = null;

  triggerLogsAddUpd$ = new Subject();

  fetchDataSub$: Subscription = null;

  processRequestSub$: Subscription = null;

  logDateTimeConfig: IDatePickerConfig = {};
  DATE_FORMAT_STRING = 'MMM  Do YYYY, hh:mm a';

  ngOnInit() {
    this.logsForm = new FormGroup({
      id: new FormControl(''),
      logDateTime: new FormControl('', [Validators.required]),
      descAct: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [Validators.required])
    });

    this.initDatePickers();
  }
  
  get id() {
    return this.logsForm.controls['id'];
  }
  
  get logDateTime() {
    return this.logsForm.controls['logDateTime'];
  } 
  
  get descAct() {
    return this.logsForm.controls['descAct'];
  }
  
  get remarks() {
    return this.logsForm.controls['remarks'];
  }

  initDatePickers() {
    const baseConfig:IDatePickerConfig = {
      format: this.DATE_FORMAT_STRING,
      allowMultiSelect: false,
      returnedValueType: ECalendarValue.Moment
    }

    this.logDateTimeConfig = {
      ...baseConfig,
    }
  }

  updateUI(editMode: LogActionTypes, id?: string) {
    this.editMode = editMode;
    
    // Update UI
    this.btnTitle = this.editMode == LogActionTypes.TYPE_LOG_EDITED ? 'Update' : 'Save';
    this.formTitle = this.editMode == LogActionTypes.TYPE_LOG_EDITED ? 'Edit Log' : 'Add Log';
    if (editMode == LogActionTypes.TYPE_LOG_EDITED) {
      this.id.setValue(id);
      this.fetchLogData();
    }
  }


  fetchLogData() {
    this.fetchDataSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: {
        query: 'logs', pdata: { id: 'id', value: this.id.value },
        selcolumns: ['data']
      }
    }).subscribe((resp: any) => {
      if (resp.status == 1) {
        const { data } = resp.response;
        const _data = JSON.parse(data);
        const processedData = {
          ..._data,
          // fix: doesn't work on "Edit Log" mode
          logDateTime: moment(_data['logDateTime']).format(this.DATE_FORMAT_STRING),
        }
        this.logsForm.setValue({
          ...processedData,
          id: this.id.value // don't change id field!,
        });
      }
    });
  }


  processRequest() {
    const values = {
      ...this.logsForm.value,
      logDateTime: moment(this.logDateTime.value).toISOString(true)
    };
    delete values.id; // remove id field from `data`
    // Upload data
    this.processRequestSub$ = this.cs.postData({
      sourceid: 'listmgr', info: {
        query: 'logs',
        tdata: {
          log_type: LogTypes.TYPE_LOG_SENSOR_ACT,
          data: JSON.stringify(values)
        },
        pdata: {
          id: 'id',
          value: this.id.value || ''
        }
      }
    })
    .pipe(
      concatMap((res: any) => {
        const logEvent: ITrackLogsEvent = {
          event: this.editMode,
          data : {
            descAct: this.descAct.value,
            logDate: this.logDateTime.value,
            logRemarks: this.remarks.value,
            logType: LogTypes.TYPE_LOGS_RADAR_OPS
          }
        };
        return this.trackingService.trackLogsEvent({
          type: TrackingTypes.TYPE_LOGS,
          uid: this.cs.user_session.id,
          data: JSON.stringify(logEvent),
        }).pipe(map(_ => res))
      })
    )
      .subscribe(
        (data: any) => {
          if (data.status == 1) {
            this.triggerLogsAddUpd$.next(data.status);
          } else {
            this.cs.openGrowl('', 'Status', 'Internal error.')
          }
        },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.')
        }
      )
  }

  

}
