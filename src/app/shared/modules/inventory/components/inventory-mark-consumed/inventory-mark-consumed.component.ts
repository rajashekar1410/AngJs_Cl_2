import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ITrackInvConsumedEvent, ITrackInvDemandedEvent, ITrackInventoryEvent } from '../../../user-tracking/models/track-inventory';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { InventoryActionTypes } from '../../models/inventory-tracking';

@Component({
  selector: 'app-inventory-mark-consumed',
  templateUrl: './inventory-mark-consumed.component.html',
  styleUrls: ['./inventory-mark-consumed.component.scss']
})
export class InventoryMarkConsumedComponent implements OnInit, OnDestroy {

  constructor(
    public mdls: IetmModalService,
    private cs: CommonService,
    public modalRef: BsModalRef,
    private trackingService: UserTrackingService
  ) { }

  formTitle = 'Update Consumed';
  btnTitle = 'Save';

  // inventory item
  invInfo = {
    id: -1,
    description: '',
    part_no: '',
    total: -1,
    consumed: -1,
    available: -1,
  };

  markConsumedForm: FormGroup = null;

  triggerMarkConsumed$ = new Subject();

  procReqSub$: Subscription = null;

  ngOnInit() {
    this.markConsumedForm = new FormGroup({
      consumed: new FormControl(0, [Validators.required, Validators.min(1), Validators.max(this.invInfo.available)]),
      remarks: new FormControl('', [Validators.required])
    });
  }

  get consumed() {
    return this.markConsumedForm.controls['consumed'];
  }

  get remarks() {
    return this.markConsumedForm.controls['remarks'];
  }

  processRequest() {
    if (!this.markConsumedForm.valid) {
      this.cs.openGrowl('', 'Status', 'Invalid data input');
      return;
    }
    // Process request
    const values = {
      id: '',
      inv_id: this.invInfo.id,
      action_type: InventoryActionTypes.TYPE_I_CONSUMED,
      uid: this.cs.user_session.id,
      quantity: this.consumed.value,
      remarks: this.remarks.value,
      date: new Date()
    };
    // compute new consumed value
    const newConsumed = parseInt(this.consumed.value) + parseInt(this.invInfo.consumed.toString());
    // process request
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: values, query: 'inventory_orders', pdata: { id: 'id', value: '' } }
    })
      // Update row in `inventory` table
      .pipe(
        concatMap((res: any) => {
          return this.cs.postData({
            sourceid: 'listmgr',
            info: { tdata: { consumed: newConsumed }, query: 'inventory', pdata: { id: 'id', value: this.invInfo.id } }
          }).pipe(map(_ => res))
        }),
        concatMap((res: any) => {
          const invEvent: ITrackInventoryEvent = {
            event: InventoryActionTypes.TYPE_I_CONSUMED,
            data: <ITrackInvConsumedEvent>{
              id: this.invInfo.id,
              invDesc: this.invInfo.description,
              invPartNo: this.invInfo.part_no,
              // fix: consumed value for User Activity->Inventory shows (x+prev_consumed_value) in row;
              // should only show current consumed value
              consumed: this.consumed.value,
              total: this.invInfo.total,
              available: this.invInfo.available,
              remarks: this.remarks.value
            }
          };
          return this.trackingService.trackInventoryEvent({
            type: TrackingTypes.TYPE_INVENTORY,
            data: JSON.stringify(invEvent),
            uid: this.cs.user_session.id
          }).pipe(map(_ => res))
        })
      )
      .subscribe(
        (res: any) => {
          this.triggerMarkConsumed$.next(res.status);
        },
        err => {
          console.error(err);
        }
      );
  }

  ngOnDestroy() {
    this.procReqSub$?.unsubscribe();
  }


}
