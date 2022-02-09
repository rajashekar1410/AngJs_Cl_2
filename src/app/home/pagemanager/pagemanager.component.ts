import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { tap } from 'rxjs/operators';
import { LRMService } from 'src/app/shared/modules/long-running-modal/services/l-r-m.service';
@Component({
  selector: 'app-pagemanager',
  templateUrl: './pagemanager.html'
})
export class PagemanagerComponent implements OnInit {
  form_title = "";
  form_btntitle = "Submit";
  editpagedata = 0;
  formvalidation = "";
  filesToUpload = [];
  selmdlid = 0;

  public related_content_types = [{ id: 1, value: 'Content Type1' }, { id: 2, value: 'Content Type2' }]
  public related_content = []
  manage = { tdata: { id: '', title: '', sequence: 0, content: '', image_upload: '', file_upload: '', parent: 0, page_category: 0, page_module: 0, related_content: '', operator_rights: 1, maintainer_rights: 1 }, query: 'pages', pdata: { id: 'id', value: '' } };

  drawingsList = [] as any[];
  canAddNewImage = true;

  constructor(
    private _location: Location,
    public cs: CommonService,
    public router: Router,
    private route: ActivatedRoute,
    private lrmS: LRMService
  ) { }

  backward() {
    this._location.back();
  }
  fileChangeEvent(fileInput: any) {
    this.filesToUpload = <Array<File>>fileInput.target.files;
  }
  addmorerel() {
    //this.cs.moduledata.module_name
    this.related_content.push({ "page_id": 0, "content_type": 0, "content_id": 0, "innerlink": 0 });
  }
  deleterel(i) {
    this.related_content.splice(i, 1);
  }
  manageformsub(pageform) {
    //console.log("/////////24")
    if (pageform.valid) {
      if (this.filesToUpload.length > 0) {

        let pageCategory = '';
        switch (parseInt(this.manage.tdata.page_category.toString())) {
          case 2:
            pageCategory = 'manuals';
            break;
          case 3:
            pageCategory = 'drawings';
            break;
          case 4:
            pageCategory = 'videos';
            break;
        }
        // Show modal
        this.lrmS.showBackdrop();
        // Process file upload
        this.cs.processFileUpload("uploadbasic", [pageCategory], this.filesToUpload)
          .pipe(
            tap(e => this.processUploadStatusEvent(e))
          )
          .subscribe(
            result => {
              // don't handle file upload ProgressEvent here
              if (result instanceof ProgressEvent) return;

              // console.log(JSON.stringify(result));
              if (this.manage.tdata.page_category == 2 || this.manage.tdata.page_category == 4) {
                this.manage.tdata.file_upload = result['filename'];
              } else if (this.manage.tdata.page_category == 3) {
                if (result['filename'].length > 0) {
                  const images = result['filename']
                    .split(',')
                    .filter((e: string) => e.length > 0)
                  this.drawingsList.push(...images);
                }
              }
              this.managepages();
            },
            error => {
              console.error(error);
              this.formvalidation = "Some error occurred while uploading file(s)";
              this.lrmS.hideBackdrop();
            });
      } else {
        //console.log('elseqwerty////');
        // console.log('elseqwerty////');
        /*if (this.manage.tdata.page_category == 2 && this.manage.tdata.id == "") {
          this.formvalidation = "Pls Upload a PDF FIle";
        } else {
        }*/
        this.managepages();
      }
    } else {
      this.formvalidation = "Fill out mandatory fields";
    }
  }

  processUploadStatusEvent(event: Event) {
    if (!(event instanceof ProgressEvent)) return;

    const percentDone = Math.round(100 * event.loaded / (event.total ?? 0));
    this.lrmS.updateMessage(`Processing: ${percentDone}%`);
  }

  managepages() {
    // finally set image names to field
    if (this.manage.tdata.page_category == 3) {
      // don't include "Browse" item's empty listing to server
      this.manage.tdata.image_upload = this.drawingsList
        .filter(e => e.length > 0)
        .toString();
    }
    let submitiondata = this.manage;
    // console.log(submitiondata)
    /*if( submitiondata.tdata.title ==''){
     this.formvalidation = "Page Title cannot be Null";
    }
   else if(submitiondata.tdata.page_category!=4 && submitiondata.tdata.content ==''){
     this.formvalidation = "Content cannot be Null";
    }
    else if( (submitiondata.tdata.content_title2 !='' && submitiondata.tdata.content_title=="") || (submitiondata.tdata.content_title3 !='' && submitiondata.tdata.content_title =="")){
     this.formvalidation = "Tab Title 1 is required if Tab2 or Tab3 contents are filled";
    }
    else if( (submitiondata.tdata.content_title2 =='' && submitiondata.tdata.content2 !="") || (submitiondata.tdata.content_title2 !='' && submitiondata.tdata.content2 =="")){
     this.formvalidation = "Tab Title2 and its Contents both are required";
    }
    else if( (submitiondata.tdata.content_title3 =='' && submitiondata.tdata.content3 !="") || (submitiondata.tdata.content_title3 !='' && submitiondata.tdata.content3 =="")){
     this.formvalidation = "Tab Title3 and its Contents both are required";
    }
    else{*/
    submitiondata['tdata']['related_content'] = JSON.stringify(this.related_content);
    //console.log(JSON.stringify(submitiondata));
    // console.log("============================");
    this.cs.postData({ sourceid: 'listmgr', info: submitiondata })
      .subscribe(data => {
        if (data['status'] == '1') {
          if (this.manage.tdata.id != "") {
            this.cs.openGrowl('', 'Status', 'Submitted Successfully');
            //  this.router.navigate(['/home/pages/pagecmp/' + this.manage.tdata.page_category + "/page/" + this.manage.tdata.id])
            this.formvalidation = "";
            this.router.navigate(['/home/pages/pagecmp/' + this.manage.tdata.page_module + "/" + this.manage.tdata.page_category + "/page/" + this.manage.tdata.id]);

            // Hide modal
            this.lrmS.hideBackdrop();
          } else {
            this.cs.openGrowl('', 'Status', 'Submitted Successfully');
            // this.router.navigate(['/home/pages/pagecmp/'  + this.manage.tdata.page_category + "/page/" + data['response']])
            this.router.navigate(['/home/pages/pagecmp/' + this.manage.tdata.page_module + "/" + this.manage.tdata.page_category + "/page/" + data['response']]);
            // Hide modal
            this.lrmS.hideBackdrop();
          }
        } else {
          this.formvalidation = "Some error occured";
          // Hide modal
          this.lrmS.hideBackdrop();
        }
      }, err => {
        console.error(err);
        // Hide modal
        this.lrmS.hideBackdrop();
      });
  }

  addNewDrawingItem() {
    this.drawingsList.push('');
    this.canAddNewImage = false;
  }

  removeDrawingItem(index: number) {
    this.drawingsList.splice(index, 1);
    this.filesToUpload[index]?.splice(index, 1);
    this.canAddNewImage = this.filesToUpload.length == 0 || !this.drawingsList.includes('');
  }

  editpage(pvalue: number) {
    this.manage.pdata.value = pvalue.toString();
    this.cs.postData({ sourceid: 'listingdetails', info: { query: 'pages', pdata: this.manage.pdata, selcolumns: Object.keys(this.manage.tdata) } })
      .subscribe(data => {
        // console.log(JSON.stringify(data));
        this.manage.tdata = data['response'];
        if (this.manage.tdata.page_category == 3) {
          if (this.manage.tdata.image_upload.length > 0) {
            const images = this.manage.tdata.image_upload.split(',');
            // fix: empty ',' item in drawingsList trigger "Browse" button
            this.drawingsList = images.filter(i => i.length > 0);
          }
        }
        this.related_content = JSON.parse(data['response']['related_content']);
        // console.log(JSON.stringify(this.drawingsList));
        //   console.log("========");
        this.editpagedata = 0;
      }, error => alert(error))
  }
  ngOnInit() {
    this.cs.page_header = "Manage Page";
    this.cs.emitPageactions('0');

    //   console.log(JSON.stringify( this.cs.moduledata));
    // console.log(">>>>>>>>>>=====================");
    this.route.params.subscribe(params => {
      // / id:node.data.id,type:'add',categoryagecategory,pagetitleagetitl
      if (params['type'] == 'add') {
        if (params['pagetitle'] != '') {
          this.form_title = "Add page under (" + params['pagetitle'] + ")";
        } else {
          this.form_title = "Add page ";
        }
        this.form_btntitle = "Submit";
        this.manage.tdata.page_category = params['category'];
        this.manage.tdata.page_module = params['moduleid'];
        this.editpagedata = 0;
        //console.log( this.manage.tdata.page_category);
        this.manage.tdata.parent = params['id'];
      } else {
        this.form_title = "Edit page: ( " + params['pagetitle'] + ")";
        this.form_btntitle = "Update";
        this.editpagedata = 1;
        this.editpage(+params['id']);
      }
    });
  }


}
