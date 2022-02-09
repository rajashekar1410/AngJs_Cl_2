import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';

@Component({
  selector: 'app-related-content-types-add-upd',
  templateUrl: './related-content-types-add-upd.component.html',
  styleUrls: ['./related-content-types-add-upd.component.scss']
})
export class RelatedContentTypesAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode = false;


  triggerAddUpdCnt$ = new Subject();

  rltdTypeForm: FormGroup = null;

  processRequestSub$: Subscription = null;

  ngOnInit() {
    this.rltdTypeForm = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [Validators.required]),
    });
  }


  updateUI(editMode: boolean, id?: string) {
    this.editMode = editMode;
    this.r_id.setValue(id);

    // Update UI
    this.btnTitle = this.editMode ? 'Update' : 'Save';
    this.formTitle = this.editMode ? 'Edit Content Type' : 'Add Content Type';

    if (editMode) this.fetchEditableData(id);
  }

  get r_id() {
    return this.rltdTypeForm.controls['id'];
  }

  get r_name() {
    return this.rltdTypeForm.controls['name'];
  }

  fetchEditableData(row) {
    // Fetch user types from database
    this.cs.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: { id: row.id }, query: 'related_content_types', selected_colnames: ['id', 'name'], search_keyword: '', search_query: '', limit: '1', offset: '0', ordercolumn: 'id', ordertype: 'desc' } } })
      .subscribe(
        (resp: any) => {
          if (resp.status == 1) {
            this.rltdTypeForm.setValue(resp.response[0]);
          }
        },
        err => {
          console.error(err);
        })
  }


  processRequest() {
    const values = this.rltdTypeForm.value;
    // delete values.id; // remove id field from `data`
    // Upload data
    this.processRequestSub$ = this.cs.postData({
      sourceid: 'listmgr', info: {
        query: 'related_content_types',
        tdata: values,
        pdata: {
          id: 'id',
          value: this.r_id.value || ''
        }
      }
    })
      .pipe(
        /*concatMap((res: any) => {
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
        })*/
      )
      .subscribe(
        (data: any) => {
          if (data.status == 1) {
            this.triggerAddUpdCnt$.next(data.status);
            this.cs.refreshRelatedContentTypes();
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
    this.processRequestSub$?.unsubscribe();
  }


}
