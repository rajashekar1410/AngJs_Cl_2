import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { concatMap, debounceTime } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';

@Component({
  selector: 'app-inventory-types-add-upd',
  templateUrl: './inventory-types-add-upd.component.html',
  styleUrls: ['./inventory-types-add-upd.component.scss']
})
export class InventoryTypesAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode = false;

  invTypeForm: FormGroup = null;

  triggerInvTypeAddUpd$ = new Subject();

  fetchInvTypeDataSub$: Subscription = null;
  validatorSub$: Subscription = null;
  procReqSub$: Subscription = null;

  ngOnInit() {
    this.invTypeForm = new FormGroup({
      id: new FormControl(''),
      invtype: new FormControl('', [Validators.required]),
    });

    this.validatorSub$ = this.invtype.valueChanges.pipe(
      debounceTime(1000),
      concatMap(invType => {
        return this.cs.postData({
          sourceid: 'uniquefield_check',
          info: {
            query: 'inventory_types',
            cdata: { id: 'name', value: invType },
            pdata: { id: 'id', value: this.id.value }
          },
        })
      })
    )
      .subscribe(
        (data: any) => {
          if (data.status != 0) {
            this.invtype.setErrors({
              ...this.invtype.errors,
              duplicateName: true
            });
          } else {
            delete this.invtype.errors?.duplicateName;
          }
        },
        err => {
          console.error(err);
        });
  }

  get id() {
    return this.invTypeForm.controls['id'];
  }

  get invtype() {
    return this.invTypeForm.controls['invtype'];
  }

  updateUI(editMode: boolean, id?: string) {
    this.editMode = editMode;

    // Update UI
    this.btnTitle = this.editMode ? 'Update' : 'Save';
    this.formTitle = this.editMode ? 'Edit Inventory Type' : 'Add Inventory Type';
    if (editMode) {
      this.id.setValue(id);
      this.fetchInvTypeData();
    }
  }

  fetchInvTypeData() {
    this.fetchInvTypeDataSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: {
        query: 'inventory_types', pdata: { id: 'id', value: this.id.value },
        selcolumns: ['id', 'name']
      }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        // process data
        const value = {
          id: data.response['id'],
          invtype: data.response['name'],
        };
        // set data
        this.invTypeForm.setValue(value);
      }
    },
      err => {
        console.error(err);
      }
    );
  }


  processRequest() {
    if (!this.invTypeForm.valid) {
      this.cs.openGrowl('', 'Status', 'Invalid data input');
      return;
    }
    const values = {
      id: this.id.value,
      name: this.invtype.value
    }
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: values, query: 'inventory_types', pdata: { id: 'id', value: values.id } }
    })
      .subscribe(
        (res: any) => {
          this.triggerInvTypeAddUpd$.next(res.status);
        },
        err => {
          console.error(err);
        }
      );
  }

  ngOnDestroy() {
    this.fetchInvTypeDataSub$?.unsubscribe();
    this.validatorSub$?.unsubscribe();
    this.procReqSub$?.unsubscribe();
  }

}
