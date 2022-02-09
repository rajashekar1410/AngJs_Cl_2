import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ITrackInvAddUpdEvent, ITrackInventoryEvent } from '../../../user-tracking/models/track-inventory';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { InventoryActionTypes } from '../../models/inventory-tracking';
import { InventoryService } from '../../services/inventory/inventory.service';

@Component({
  selector: 'app-inventory-add-upd',
  templateUrl: './inventory-add-upd.component.html',
  styleUrls: ['./inventory-add-upd.component.scss']
})
export class InventoryAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    public mdls: IetmModalService,
    private cs: CommonService,
    private invS: InventoryService,
    private trackingService: UserTrackingService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode: InventoryActionTypes = -1;
  inventoryActionTypes = InventoryActionTypes;

  origInvForm: FormGroup = null;
  invForm: FormGroup = null;

  triggerInvAddUpd$ = new Subject();

  invTypes = [];
  fetchInvTypesSub$: Subscription = null;
  invTypeValidatorSub$: Subscription = null;
  consumedValidatorSub$: Subscription = null;
  totalValidatorSub$: Subscription = null;

  fetchInvDataSub$: Subscription = null;

  procReqSub$: Subscription = null;

  ngOnInit() {
    this.invForm = new FormGroup({
      id: new FormControl(''),
      invType: new FormControl(-1, [Validators.required]),
      partNumber: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      total: new FormControl('', [Validators.required]),
      uom: new FormControl('', [Validators.required]),
      consumed: new FormControl('', [Validators.required, Validators.min(0)]),
      remarks: new FormControl('', [Validators.required]),
    });
    this.origInvForm = new FormGroup({
      id: new FormControl(''),
      invType: new FormControl(-1, [Validators.required]),
      partNumber: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      total: new FormControl('', [Validators.required]),
      uom: new FormControl('', [Validators.required]),
      consumed: new FormControl('', [Validators.required]),
      // store dyn `available` value in origInvForm
      available: new FormControl(''),
      remarks: new FormControl('', [Validators.required]),
    });

    // `invType` shouldn't be -1
    this.invTypeValidatorSub$ = this.invForm.valueChanges.subscribe(value => {
      const v = value.invType;
      if (v != -1) {
        delete this.invType.errors?.incorrectType;
      } else {
        this.invType.setErrors({
          incorrectType: true,
          ...this.invType.errors
        });
      }
    });

    // `consumed` should be <= `total`
    this.consumedValidatorSub$ = this.consumed.valueChanges.subscribe(v => {
      if (parseInt(v) <= parseInt(this.total.value)) {
        delete this.consumed.errors?.exceedsTotal;
      } else {
        this.consumed.setErrors({
          exceedsTotal: true,
          ...this.invType.errors
        });
      }
      // update `available` value 
      this.origInvForm.controls.available.setValue(
        (this.origInvForm.value.total - this.origInvForm.value.consumed) - this.consumed.value
      );
      this.origInvForm.updateValueAndValidity();
    });

    // `consumed` should be <= `total`
    this.totalValidatorSub$ = this.total.valueChanges.subscribe(v => {
      this.origInvForm.controls.total.setValue(v);
      this.origInvForm.updateValueAndValidity();
    });

    // Fetch inv types
    this.fetchInvTypes();
  }

  fetchInvTypes() {
    this.fetchInvTypesSub$ = this.invS.fetchInvTypes()
      .subscribe(
        (data: any) => {
          if (data.status == 1) {
            this.invTypes = data.response;
          }
        },
        err => {
          console.error(err);
        }
      );
  }

  fetchInvData() {
    this.fetchInvDataSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: {
        query: 'inventory', pdata: { id: 'id', value: this.id.value },
        selcolumns: ['id', 'inv_type', 'part_no', 'description', 'total', 'uom', 'consumed', 'remarks']
      }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        // process data
        const value = {
          ...data.response,
          invType: data.response['inv_type'],
          partNumber: data.response['part_no'],
        };
        // remove incompatible fields
        delete value.inv_type;
        delete value.part_no;
        // set data
        this.invForm.setValue(value);
        this.origInvForm.setValue({
          ...value,
          available: (value.total - value.consumed) || 0
        });
      }
    },
      err => {
        console.error(err);
      }
    );
  }

  processRequest() {
    if (!this.invForm.valid) {
      this.cs.openGrowl('', 'Status', 'Invalid data input');
      return;
    }
    const values = {
      id: this.id.value,
      inv_type: this.invType.value,
      part_no: this.partNumber.value,
      description: this.description.value,
      total: this.total.value,
      uom: this.uom.value,
      consumed: this.consumed.value,
      remarks: this.remarks.value
    }
    // update consumed if consumed mode
    if (this.editMode == InventoryActionTypes.TYPE_I_CONSUMED) {
      values.consumed = this.origInvForm.value.consumed + this.consumed.value;
    }
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: values, query: 'inventory', pdata: { id: 'id', value: values.id } }
    })
    .pipe(
      // add row to inventory_orders
      concatMap((res: any) => {
        const idValue = this.id.value == '' ? res['response'] : this.id.value;
        const values = {
          id: '',
          inv_id: idValue,
          action_type: this.editMode,
          uid: this.cs.user_session.id,
          quantity: this.total.value,
          remarks: this.remarks.value,
          date: new Date()
        };
        return this.cs.postData({
          sourceid: 'listmgr',
          info: { tdata: values, query: 'inventory_orders', pdata: { id: 'id', value: '' } }
        }).pipe(map(_ => res))
      }),
      concatMap((res: any) => {
        const invEvent: ITrackInventoryEvent = {
          event: this.editMode,
          data: <ITrackInvAddUpdEvent>{
            id: values.id,
            invDesc: values.description,
            invPartNo: values.part_no,
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
          this.triggerInvAddUpd$.next(res.status);
        },
        err => {
          console.error(err);
        }
      );
  }

  updateUI(editMode: InventoryActionTypes, id?: string) {
    this.editMode = editMode;
    // console.log(editMode)

    // Update UI
    switch (this.editMode) {
      case InventoryActionTypes.TYPE_I_ADD:
        this.btnTitle = 'Save';
        this.formTitle = 'Add Inventory';
        this.consumed.setValue(0);
        this.consumed.disable();
        break;
      case InventoryActionTypes.TYPE_I_EDIT:
        this.btnTitle = 'Update';
        this.formTitle = 'Edit Inventory';
        // set data
        this.id.setValue(id);
        this.fetchInvData();
        break;
      case InventoryActionTypes.TYPE_I_CONSUMED:
        this.btnTitle = 'Update';
        this.formTitle = 'Update Consumed';
        // set data
        this.id.setValue(id);
        this.fetchInvData();
        this.invType.disable();
        break;
      default:
        break;
    }
  }

  get id() {
    return this.invForm.controls['id'];
  }

  get invType() {
    return this.invForm.controls['invType'];
  }

  get partNumber() {
    return this.invForm.controls['partNumber'];
  }

  get description() {
    return this.invForm.controls['description'];
  }

  get total() {
    return this.invForm.controls['total'];
  }

  get uom() {
    return this.invForm.controls['uom'];
  }

  get consumed() {
    return this.invForm.controls['consumed'];
  }

  get remarks() {
    return this.invForm.controls['remarks'];
  }

  ngOnDestroy() {
    this.fetchInvTypesSub$?.unsubscribe();
    this.invTypeValidatorSub$?.unsubscribe();
    this.fetchInvDataSub$?.unsubscribe();
    this.procReqSub$?.unsubscribe();
    this.consumedValidatorSub$?.unsubscribe();
    this.totalValidatorSub$?.unsubscribe();
  }

}
