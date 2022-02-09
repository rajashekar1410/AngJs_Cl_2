import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ISContentArray, ISContentTypes, ISIETMCoreChildItem, IISAnnotationChildItem } from '../../models/intelligent-search';

@Component({
  selector: 'app-search-add-upd',
  templateUrl: './search-add-upd.component.html',
  styleUrls: ['./search-add-upd.component.scss']
})
export class SearchAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService
  ) { }

  ngForm: FormGroup = null;

  // Category 'All' is absurd when adding new search item, think about it!
  contentTypes = ISContentArray.slice(1);
  contentTypeIds = ISContentTypes;

  ietmChildItems: Array<ISIETMCoreChildItem | IISAnnotationChildItem> = [];

  trigger$ = new EventEmitter();

  fetchDataSub$: Subscription = null;

  editMode = false;

  btnTitle = '';
  formTitle = '';

  modalRef: BsModalRef = null;

  ngOnInit(): void {
    this.ngForm = new FormGroup({
      id: new FormControl(''),
      keyword: new FormControl('', [Validators.required]),
      type: new FormControl(this.contentTypes[0].id, [Validators.required]),
      child_items: new FormControl('', [Validators.required]),
      suggestions: new FormControl(''),
    });

    // Fix content filter
    this.contentTypes = this.contentTypes.filter(e => {
      switch(e.id) {
        case ISContentTypes.TYPE_IETM:
          return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 1));
        case ISContentTypes.TYPE_MANUALS:
          return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 2));
        case ISContentTypes.TYPE_DRAWINGS:
          return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 3));
        case ISContentTypes.TYPE_INVENTORY:
          return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 6));
        default:
           return true;
      }
    });
  }

  contentTypeChanged(event) {
    // reset ietmChildItems
    this.ietmChildItems = [];
    // reset childItems FormControl
    this.childItems.setValue('');
    // Add 1 row
    this.addNewIETMChild();
  }

  updateUI(editMode: boolean, id?: string) {
    this.editMode = editMode;
    this.id.setValue(id);

    // Update UI
    this.btnTitle = this.editMode ? 'Update' : 'Save';
    this.formTitle = this.editMode ? 'Edit Search Item' : 'Add New Search Item';
    if (editMode) {
      this.fetchContent();
      this.contentType.disable();
    } else {
      this.contentType.enable();
      this.addNewIETMChild();
    }
  }


  public get id(): FormControl {
    return this.ngForm.get('id') as FormControl;
  }

  public get keyword(): FormControl {
    return this.ngForm.get('keyword') as FormControl;
  }

  public get contentType(): FormControl {
    return this.ngForm.get('type') as FormControl;
  }

  public get childItems(): FormControl {
    return this.ngForm.get('child_items') as FormControl;
  }

  public get suggestions(): FormControl {
    return this.ngForm.get('suggestions') as FormControl;
  }

  addNewIETMChild() {
    const value = parseInt(this.contentType.value);
    switch (value) {
      case this.contentTypeIds.TYPE_DRAWINGS:
      case this.contentTypeIds.TYPE_MANUALS:
      case this.contentTypeIds.TYPE_IETM: {
        this.ietmChildItems.push({
          page_id: 0
        });
        break;
      }
      case this.contentTypeIds.TYPE_ANNOTATION:
        this.ietmChildItems.push({
          id: 0
        });
        break;
      default:
        console.log(value);
        throw new Error("Content not supported");
    }
  }

  removeIETMChild(index: number) {
    this.ietmChildItems.splice(index, 1);
  }

  fetchContent() {
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'gs_keywords', pdata: { id: 'id', value: this.id.value }, selcolumns: ['id', 'keyword', 'type', 'child_items', 'suggestions'] }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        // console.log(data.response);
        this.ngForm.setValue(data.response);
        this.contentType.setValue(data.response.type);
        try {
          // remove special UTF8 chars
          data.response.child_items = data.response.child_items.replace(/[\x00-\x1f]*/g, '');
          this.ietmChildItems = JSON.parse(data.response.child_items);
        } catch (_) {
          console.error(_);
          this.ietmChildItems = [];
        }
      }
    },
      err => {
        console.error(err);
        this.cs.openGrowl('', 'Status', 'Unable to fetch data.');
      });
  }

  processRequest() {
    // remove invalid UTF8 chars
    const childItems = this.ietmChildItems.map(el => {
      if (el.title) {
        el.title = el.title.replace(/[\x00-\x1f]*/g, '');
      }
      if (el['description']) {
        el['description'] = el['description'].replace(/[\x00-\x1f]*/g, '');
      }
      return el;
    });
    // child_items needs to be set.
    this.childItems.setValue(childItems);
    // check form is valid
    if (this.ngForm.valid) {
      this.fetchDataSub$ = this.cs.postData({
        sourceid: 'gs_listmgr',
        // don't use `value` as it wouldn't include
        // disabled `contentType` FormControl
        info: this.ngForm.getRawValue()
      })
        .subscribe(
          (data: any) => {
            const { status } = data;
            if (status == 1) {
              this.modalRef?.hide();
              this.trigger$.next(status);
            } else {
              this.cs.openGrowl('', 'Status', 'Error occurred. Content is not allowed or invalid input data.');
            }
          },
          err => {
            console.error(err);
            this.cs.openGrowl('', 'Status', 'Error occurred');
          });
    } else {
      this.cs.openGrowl('', 'Status', 'Invalid input data.');
    }
  }

  ngOnDestroy() {
    this.fetchDataSub$?.unsubscribe();
    this.trigger$.unsubscribe();
  }

}
