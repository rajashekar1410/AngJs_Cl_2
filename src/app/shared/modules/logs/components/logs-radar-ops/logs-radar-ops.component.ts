import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ECalendarValue, IDatePickerConfig } from 'ng2-date-picker';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { of, Subject, Subscription, merge } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ITrackLogAddUpdEvent, ITrackLogsEvent, LogActionTypes } from '../../../user-tracking/models/track-logs';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { LogTypes } from '../../models/log-types';

@Component({
  selector: 'app-logs-radar-ops',
  templateUrl: './logs-radar-ops.component.html',
  styleUrls: ['./logs-radar-ops.component.scss']
})
export class LogsRadarOpsComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    public modalRef: BsModalRef,
    private trackingService: UserTrackingService
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode: LogActionTypes = -1;

  logsForm: FormGroup = null;

  triggerLogsAddUpd$ = new Subject();
  fetchDataSub$: Subscription = null;
  processRequestSub$: Subscription = null;
  inputDateValidatorSub$: Subscription = null;

  swOffConfig:IDatePickerConfig = {};
  swOnConfig:IDatePickerConfig = {};
  DATE_FORMAT_STRING = 'MMM  Do YYYY, hh:mm a';

  ngOnInit() {
    this.logsForm = new FormGroup({
      id: new FormControl(''),
      swOnDateTime: new FormControl('', [Validators.required]),
      swOffDateTime: new FormControl('', [Validators.required]),
      totalOpTime: new FormControl(0, [Validators.required]),
      remarks: new FormControl('', [Validators.required])
    });

    this.inputDateValidatorSub$ = merge(
        this.swOffDateTime.valueChanges,
        this.swOnDateTime.valueChanges
    ).subscribe(_ => {
      // validate input dates
      const onDateTime = this.swOnDateTime.value;
      const offDateTime = this.swOffDateTime.value;
      const isOkay = moment(offDateTime).isAfter(onDateTime);
      if (!isOkay) {
        this.swOffDateTime.setErrors({
          ...this.swOffDateTime.errors,
          exceedsOnTime: true
        });
      } else {
        delete this.swOffDateTime.errors?.exceedsOnTime;
      }
      // Compute total op time
      const computedValue = moment(offDateTime).diff(onDateTime, 'hours', true).toString();
      if (computedValue && !this.swOffDateTime.errors?.exceedsOnTime) {
        this.totalOpTime.setValue(parseFloat(computedValue).toFixed(2));
      }
    });

    this.initDatePickers();
  }

  get id() {
    return this.logsForm.controls['id'];
  }

  get swOnDateTime() {
    return this.logsForm.controls['swOnDateTime'];
  }

  get swOffDateTime() {
    return this.logsForm.controls['swOffDateTime'];
  }

  get totalOpTime() {
    return this.logsForm.controls['totalOpTime'];
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

    this.swOnConfig= {
      ...baseConfig,
      min: moment().toISOString()

    }
    this.swOffConfig= {
      ...baseConfig,
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
          swOnDateTime: moment(_data['swOnDateTime']).format(this.DATE_FORMAT_STRING),
          swOffDateTime: moment(_data['swOffDateTime']).format(this.DATE_FORMAT_STRING),
        }
        this.logsForm.setValue({
          ...processedData,
          id: this.id.value // don't change id field!,
        });
      }
    });
  }

  updateUI(editMode: LogActionTypes, id?: string) {
    this.editMode = editMode;
    // Update UI
    this.btnTitle = editMode == LogActionTypes.TYPE_LOG_EDITED ? 'Update' : 'Save';
    this.formTitle = editMode == LogActionTypes.TYPE_LOG_EDITED ? 'Edit Log' : 'Add Log';
    if (editMode == LogActionTypes.TYPE_LOG_EDITED) {
      this.id.setValue(id);
      this.fetchLogData();
    }
  }

  processRequest() {
    const values = this.logsForm.value;
    delete values.id; // remove id field from `data`
    // Upload data
    this.processRequestSub$ = this.cs.postData({
      sourceid: 'listmgr', info: {
        query: 'logs',
        tdata: {
          log_type: LogTypes.TYPE_LOGS_RADAR_OPS,
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
            data: {
              swOffDateTime: this.swOffDateTime.value,
              swOnDateTime: this.swOnDateTime.value,
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

  ngOnDestroy() {
    this.fetchDataSub$?.unsubscribe();
    this.processRequestSub$?.unsubscribe();
    this.inputDateValidatorSub$?.unsubscribe();
  }

}


