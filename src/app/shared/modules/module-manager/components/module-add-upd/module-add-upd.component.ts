import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, concatMap, filter } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';

@Component({
  selector: 'app-module-add-upd',
  templateUrl: './module-add-upd.component.html',
  styleUrls: ['./module-add-upd.component.scss']
})
export class ModuleAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    public cs: CommonService,
    public modalRef: BsModalRef
  ) { }

  formTitle = ''
  btnTitle = ''
  editMode = false;

  localImage = {
    triggered: false,
    path: ''
  }

  ngForm: FormGroup = null;

  triggerModuleAddUpd$ = new Subject();

  nameValidatorSub$: Subscription = null;
  positionValidatorSub$: Subscription = null;

  ngOnInit() {
    this.ngForm = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [Validators.required]),
      image: new FormControl('', [Validators.required]),
      operator_rights: new FormControl(1),
      maintainer_rights: new FormControl(1),
      item_order: new FormControl('', [Validators.required])
    });

    /*this.nameValidatorSub$ = this.name.valueChanges.pipe(
      debounceTime(1000),
      concatMap(invType => {
        return this.cs.postData({
          sourceid: 'uniquefield_check',
          info: {
            query: 'page_modules',
            cdata: { id: 'name', value: invType },
            pdata: { id: 'id', value: this.m_id.value }
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
        */
    this.positionValidatorSub$ = this.m_position.valueChanges.pipe(
      debounceTime(1000),
      filter(_ => !this.editMode),
      concatMap(invType => {
        return this.cs.postData({
          sourceid: 'uniquefield_check',
          info: {
            query: 'page_modules',
            cdata: { id: 'item_order', value: invType },
            pdata: { id: 'id', value: this.m_id.value }
          },
        })
      })
    )
      .subscribe(
        (data: any) => {
          if (data.status != 0) {
            this.m_position.setErrors({
              ...this.m_position.errors,
              duplicatePosition: true
            });
          } else {
            delete this.m_position.errors?.duplicatePosition;
          }
        },
        err => {
          console.error(err);
        });
  }

  updateUI(editMode: boolean, id?: string) {
    this.editMode = editMode;
    this.m_id.setValue(id);

    // Update UI
    this.btnTitle = this.editMode ? 'Update' : 'Save';
    this.formTitle = this.editMode ? 'Edit Module' : 'Add Module';
    if (editMode) {
      this.fetchModuleData();
    }
  }

  fetchModuleData() {
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'page_modules', pdata: { id: 'id', value: this.m_id.value }, selcolumns: ['name', 'image', 'item_order'] }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        const { name, image, item_order } = data.response;
        this.name.setValue(name);
        this.image.setValue(image);
        this.m_position.setValue(item_order)
        // Update UI
        this.localImage = {
          triggered: false,
          path: ''
        }
      }
    });
  }

  get m_id() {
    return this.ngForm.controls['id'];
  }

  get name() {
    return this.ngForm.controls['name'];
  }

  get image() {
    return this.ngForm.controls['image'];
  }

  get m_position() {
    return this.ngForm.controls['item_order'];
  }

  fileChangedEvent(event) {
    const self = this;
    if (event.target.files.length > 0) {
      this.image.setValue(event.target.files);
      this.localImage = {
        triggered: true,
        path: event.target.files[0].path || ''
      }
      // preview local image
      readURL(event.target);
    }

    /**
     * Image preview for local images (read from disk)
     * @param input provide `event.target`
     */
    function readURL(input) {
      if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e: any) {
          // for preview only
          self.localImage.path = e.target.result || '';
          // for server upload
          self.image.setValue(input.files);
        }

        reader.readAsDataURL(input.files[0]); // convert to base64 string
      }
    }

  }

  async processRequest() {
    if (this.ngForm.valid) {
      if (this.localImage.triggered) {
        try {
          const result = await this.cs.makeFileRequest("uploadbasic", ['modules'], this.image.value as File[]);
          // When local image is uploaded, set the resultant path for server.
          this.image.setValue(result['filename']);

        } catch (err) {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.')
        }
      }
      // Upload data
      this.cs.postData({
        sourceid: 'listmgr', info: {
          query: 'page_modules',
          tdata: {
            name: this.name.value,
            // Set image name received from server.
            image: this.image.value,
            ...this.ngForm.value
          },
          pdata: {
            id: 'id',
            value: this.m_id.value || ''
          }
        }
      }).subscribe((data: any) => {
        if (data.status == 1) {
          this.triggerModuleAddUpd$.next(data.status);
        } else {
          this.cs.openGrowl('', 'Status', 'Internal error.')
        }
      },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.')
        })
      // this.cs.makeFileRequest("uploadbasic", ['modules'], this.image.value as File[]).then(result => {
      //   //   console.log(JSON.stringify(result));

      // })
      //   .catch(err => {
      //     console.error(err)
      //     this.cs.openGrowl('', 'Status', 'Internal error.')
      //   })
    }
  }

  ngOnDestroy() {
    this.nameValidatorSub$?.unsubscribe();
    this.positionValidatorSub$?.unsubscribe();
  }

}
