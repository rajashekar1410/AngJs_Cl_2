import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ITrackInvDelEvent, ITrackInventoryEvent } from '../../../user-tracking/models/track-inventory';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { InventoryActionTypes } from '../../models/inventory-tracking';

@Component({
  selector: 'app-inventory-del',
  templateUrl: './inventory-del.component.html',
  styleUrls: ['./inventory-del.component.scss']
})
export class InventoryDelComponent implements OnInit, OnDestroy {

  constructor(
    public mdls: IetmModalService,
    private cs: CommonService,
    public modalRef: BsModalRef,
    private trackingService: UserTrackingService
  ) { }

  // inventory item
  invInfo = {
    id: -1,
    description: '',
    part_no: '',
    total: -1,
    consumed: -1
  };

  // used to delete either from `inventory` or `inventory_types`
  targetTableName = 'inventory';

  triggerDel$ = new Subject();

  delItemSub$: Subscription = null;

  ngOnInit(): void {
  }

  processRequest() {
    // TODO: improve this
    if (this.targetTableName == 'inventory') {
      this.deleteInventory();
    } else if (this.targetTableName == 'inventory_types') {
      this.deleteInventoryType();
    } else {
      throw new Error('Internal error');
    }
  }

  deleteInventoryType() {
    if (this.invInfo.id >= 0) {
      this.delItemSub$ = this.cs.postData({ sourceid: 'list_rowdel', info: { query: this.targetTableName, column: 'id', selids: [this.invInfo.id] } })
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

  deleteInventory() {
    if (this.invInfo.id >= 0) {
      this.delItemSub$ = this.cs.postData({ sourceid: 'calldbproc', info: { procname: 'delete_inv_proc', vals: [this.invInfo.id] } })
        .pipe(
          concatMap((res: any) => {
            const invEvent: ITrackInventoryEvent = {
              event: InventoryActionTypes.TYPE_I_DEL,
              data: <ITrackInvDelEvent>{
                id: this.invInfo.id,
                invDesc: this.invInfo.description,
                invPartNo: this.invInfo.part_no
              }
            };
            return this.trackingService.trackInventoryEvent({
              type: TrackingTypes.TYPE_INVENTORY,
              data: JSON.stringify(invEvent),
              uid: this.cs.user_session.id
            }).pipe(map(_ => res))
          })
        )
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
