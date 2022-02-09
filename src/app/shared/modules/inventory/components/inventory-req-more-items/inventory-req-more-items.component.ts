import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ITrackInvDemandedEvent, ITrackInventoryEvent } from '../../../user-tracking/models/track-inventory';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { InventoryActionTypes } from '../../models/inventory-tracking';

@Component({
  selector: 'app-inventory-req-more-items',
  templateUrl: './inventory-req-more-items.component.html',
  styleUrls: ['./inventory-req-more-items.component.scss']
})
export class InventoryReqMoreItemsComponent implements OnInit, OnDestroy {

  constructor(
    public mdls: IetmModalService,
    private cs: CommonService,
    public modalRef: BsModalRef,
    private trackingService: UserTrackingService
  ) { }

  formTitle = 'Request More Inventory';
  btnTitle = 'Save';

  // inventory item
  invInfo = {
    id: -1,
    description: '',
    part_no: '',
    total: -1,
    consumed: -1
  };

  reqMoreItemsForm: FormGroup = null;

  triggerReqMoreItems$ = new Subject();

  procReqSub$: Subscription = null;

  ngOnInit() {
    this.reqMoreItemsForm = new FormGroup({
      demanded: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [Validators.required]),
    });
    console.log(this.invInfo);
  }

  get demanded() {
    return this.reqMoreItemsForm.controls['demanded'];
  }

  get remarks() {
    return this.reqMoreItemsForm.controls['remarks'];
  }

  processRequest() {
    if (!this.reqMoreItemsForm.valid) {
      this.cs.openGrowl('', 'Status', 'Invalid data input');
      return;
    }
    // Process request
    const values = {
      id: '',
      inv_id: this.invInfo.id,
      action_type: InventoryActionTypes.TYPE_I_DEMANDED,
      uid: this.cs.user_session.id,
      quantity: this.demanded.value,
      remarks: this.remarks.value,
      action_done: 0, // set to 0 so we can track its progress
      date: new Date()
    };
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: values, query: 'inventory_orders', pdata: { id: 'id', value: '' } }
    })
    .subscribe(
      (res: any) => {
        this.triggerReqMoreItems$.next(res.status);
      },
      err => {
        console.error(err);
      }
    );
    const invEvent: ITrackInventoryEvent = {
      event: InventoryActionTypes.TYPE_I_DEMANDED,
      data: <ITrackInvDemandedEvent>{
        demanded: this.demanded.value,
        id: this.invInfo.id,
        invDesc: this.invInfo.description,
        invPartNo: this.invInfo.part_no,
        isReceived: false,
        remarks: this.remarks.value
      }
    };
    this.procReqSub$ = this.trackingService.trackInventoryEvent({
      type: TrackingTypes.TYPE_INVENTORY,
      uid: this.cs.user_session.id,
      data: JSON.stringify(invEvent)
    })
      .subscribe(
        (res: any) => {
          this.triggerReqMoreItems$.next(res.status);
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
