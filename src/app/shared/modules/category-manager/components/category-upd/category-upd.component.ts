import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, concatMap, filter } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';

@Component({
  selector: 'app-category-upd',
  templateUrl: './category-upd.component.html',
  styleUrls: ['./category-upd.component.scss']
})
export class CategoryUpdComponent implements OnInit, OnDestroy {

  constructor(
    public cs: CommonService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode = false;

  ngForm: FormGroup = null;

  triggerCategoryAddUpd$ = new Subject();

  nameValidatorSub$: Subscription = null;
  positionValidatorSub$: Subscription = null;

  ngOnInit() {
    this.ngForm = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [Validators.required]),
      operator_rights: new FormControl(1),
      maintainer_rights: new FormControl(1),
      admin_rights: new FormControl(1),
      item_order: new FormControl('', [Validators.required])
    });

    this.nameValidatorSub$ = this.name.valueChanges.pipe(
      debounceTime(1000),
      concatMap(invType => {
        return this.cs.postData({
          sourceid: 'uniquefield_check',
          info: {
            query: 'pagecategories',
            cdata: { id: 'name', value: invType },
            pdata: { id: 'id', value: this.c_id.value }
          },
        })
      })
    )
      .subscribe(
        (data: any) => {
          if (data.status != 0) {
            this.name.setErrors({
              ...this.name.errors,
              duplicateName: true
            });
          } else {
            delete this.name.errors?.duplicateName;
          }
        },
        err => {
          console.error(err);
        });

    this.positionValidatorSub$ = this.c_position.valueChanges.pipe(
      debounceTime(1000),
      filter(_ => !this.editMode),
      concatMap(invType => {
        return this.cs.postData({
          sourceid: 'uniquefield_check',
          info: {
            query: 'pagecategories',
            cdata: { id: 'item_order', value: invType },
            pdata: { id: 'id', value: this.c_id.value }
          },
        })
      })
    )
      .subscribe(
        (data: any) => {
          if (data.status != 0) {
            this.c_position.setErrors({
              ...this.c_position.errors,
              duplicatePosition: true
            });
          } else {
            delete this.c_position.errors?.duplicatePosition;
          }
        },
        err => {
          console.error(err);
        });
  }

  updateUI(editMode: boolean, id?: string) {
    this.editMode = editMode;
    this.c_id.setValue(id);

    // Update UI
    this.btnTitle = this.editMode ? 'Update' : 'Save';
    this.formTitle = this.editMode ? 'Edit Category' : 'Add Category';
    if (editMode) {
      this.fetchCategoryData();
    }
  }


  get c_id() {
    return this.ngForm.controls['id'];
  }

  get name() {
    return this.ngForm.controls['name'];
  }

  get maintainer_rights() {
    return this.ngForm.controls['maintainer_rights'];
  }
  
  get admin_rights() {
    return this.ngForm.controls['admin_rights'];
  }

  get operator_rights() {
    return this.ngForm.controls['operator_rights'];
  }

  get c_position() {
    return this.ngForm.controls['item_order'];
  }


  fetchCategoryData() {
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'pagecategories', pdata: { id: 'id', value: this.c_id.value }, selcolumns: ['name', 'admin_rights', 'maintainer_rights', 'operator_rights', 'item_order'] }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        const { name, admin_rights, maintainer_rights, operator_rights, item_order } = data.response;
        this.name.setValue(name);
        this.admin_rights.setValue(admin_rights);
        this.maintainer_rights.setValue(maintainer_rights);
        this.operator_rights.setValue(operator_rights);
        this.c_position.setValue(item_order);
      }
    });
  }

  processRequest() {
    if (this.ngForm.valid) {
      // Upload data
      this.cs.postData({
        sourceid: 'listmgr', info: {
          query: 'pagecategories',
          tdata: {
            name: this.name.value,
            ...this.ngForm.value
          },
          pdata: {
            id: 'id',
            value: this.c_id.value || ''
          }
        }
      })
        .subscribe(
          (data: any) => {
            if (data.status == 1) {
              this.triggerCategoryAddUpd$.next(data.status);
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

  ngOnDestroy() {
    this.nameValidatorSub$?.unsubscribe();
    this.positionValidatorSub$?.unsubscribe();
  }

}
