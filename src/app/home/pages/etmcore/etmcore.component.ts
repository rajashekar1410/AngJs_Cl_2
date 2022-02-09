import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, ApplicationRef, ViewEncapsulation } from '@angular/core';
import { CommonService } from '../../../core/services/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { IetmModalService } from '../../../core/services/ietm-modal/ietm-modal.service';
import { BsModalService, ModalDirective } from 'ngx-bootstrap/modal';
import { interval, Subject, Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { DomSanitizer } from '@angular/platform-browser'
import { ListingService } from 'src/app/core/services/listing/listing.service';
import * as Viewer from '../../../../assets/vendors/imgviewer-new/viewer.js';
import { concatMap, delay, delayWhen, map, switchMap } from 'rxjs/operators';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { ITrackBookmarkEvent, TrackBookmarkEvent } from 'src/app/shared/modules/user-tracking/models/track-bookmark';
import { ITrackAnnotationEvent, TrackAnnotationEvent } from 'src/app/shared/modules/user-tracking/models/track-annotation';
import { HyperlinkAddUpdComponent } from 'src/app/shared/modules/hyperlink/components/hyperlink-add-upd/hyperlink-add-upd.component';
import { HyperlinkService } from 'src/app/shared/modules/hyperlink/services/hyperlink/hyperlink.service';
import { HyperlinkActionTypes, IHyperlinkAddActionData, IHyperlinkTransmitData } from 'src/app/shared/modules/hyperlink/models/hyperlink-data';
import { HyperlinkPreviewComponent } from 'src/app/shared/modules/hyperlink/components/hyperlink-preview/hyperlink-preview.component';
import { HyperlinkDeleteComponent } from 'src/app/shared/modules/hyperlink/components/hyperlink-delete/hyperlink-delete.component';
import { PrintDataService } from 'src/app/shared/modules/print-data/services/print-data.service';
import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { TippyInstance, TippyService } from '@ngneat/helipopper';
import { hideAll } from 'tippy.js';
import { ShareThisFactory } from 'src/assets/vendors/txtAnnotator/share-this';

declare var $: JQueryStatic;
declare var rangy: any;
declare var ShareThis: ShareThisFactory;

@Component({
  selector: 'app-etmcore',
  templateUrl: './etmcore.html',
  encapsulation: ViewEncapsulation.None
})
export class etmcoreComponent implements OnInit, OnDestroy {
  @ViewChild('deletbkmbtn') public deletbkmbtnref: ElementRef;
  @ViewChild('printtriger') public printtriger: ElementRef;
  @ViewChild('bookmarkbtn') public bkmrmdlref: ElementRef;
  @ViewChild('xyz123') public pdfdref: ElementRef;
  @ViewChild('antbtn') public antbtnref: ElementRef;
  @ViewChild('viewant') public antviewref: ElementRef;
  @ViewChild('viewantdt') public antviewdtref: ElementRef;
  @ViewChild('pc') public pgdesc: ElementRef;
  @ViewChild('annotsview', { static: true }) public annotsview: ModalDirective;
  @ViewChild('annotslist') public annotslist: ModalDirective;
  @ViewChild('explainermdl', { static: true }) public explainermdl: ModalDirective;
  @ViewChild('glossarymdl', { static: true }) public glossarymdl: ModalDirective;

  public tbl_start = 0;
  public printpreview_text = '';
  dtOptions: DataTables.Settings = {};
  public dtfilters = {};
  public ant_form_title = "Add Annotation";
  public showantform = false;
  public ant_btn_title = "SUBMIT";
  public imageIndex = 0;
  public annotslit = [];
  public printvd: any;
  public loadpdf = false;
  public drawingsrc = '';
  public showoverlay = false;
  public searchlistid = 0;
  userlist = 0;
  retype_pwd = "";
  present_password = "";
  anoate_typefilter = 10;
  annoatetype = 10;
  selectedanotival = 0;
  public opened_relcon_name = "";
  public relatedcontent_fullmode = 0;
  protected ngUnsubscribe = new Subject<void>();
  explainerdata = { id: '', content_type: '', content_title: '', content: '' };
  selgossarydata = { id: '', glossary_type: 0, golssary_name: '', description: '' };
  public selected_annotation = { id: 0, created_by: 0 };
  public annotdata = { id: '', title: '', page_id: 0, description: '', annotation_type: 1, created_by: this.cs.user_session.id };

  public bookmarkeid = 0;
  bookmarkName = '';

  public related_content = [];
  public prepared_relatedcontent = { title: '', data: '', type: 0, content_type: 0, page_id: 0 };
  //public electwindow=new ElectronService().remote.dialog;

  // dynamic hotspot
  wmEmitter = new Subject<any>()
  wmpEmitter = new Subject<any>()
  wmdEmitter = new Subject<any>()

  // hyperlink
  hotspotEventsSub$: Subscription = null;

  tableWidthAdjustSub$: Subscription = null;

  drawingsList = [];

  constructor(
    public appref: ApplicationRef,
    private sanitizer: DomSanitizer,
    public ls: ListingService,
    public cdr: ChangeDetectorRef,
    public mdls: IetmModalService,
    public cs: CommonService,
    public router: Router,
    private route: ActivatedRoute,
    private trackingService: UserTrackingService,
    private modalS: BsModalService,
    private hS: HyperlinkService,
    private printDataService: PrintDataService,
    private tippyS: TippyService,
  ) {
    //routingState.loadRouting();
    //  console.log("loaded construnctor");
    this.cs.emitChange('1');
    this.cs.triggerPrintEmited$.subscribe(
      text => {
        if (text == "1") {
          this.triggerpdf();
        }
        if (text == "2") {
          if (this.cs.isbookmarked == 1) {
            let el: HTMLElement = this.deletbkmbtnref.nativeElement as HTMLElement;
            el.click();
          } else {
            this.bkmtdata = { id: '', page_id: 0, bookmark_name: '', created_by: this.cs.user_session.id };
            this.appref.tick();
            let el: HTMLElement = this.bkmrmdlref.nativeElement as HTMLElement;
            el.click();
          }
          //this.openmdl(this.bkmrmdlref);
        }
        if (text == "3") {
          this.annotdata = { id: '', title: '', page_id: 0, description: '', annotation_type: 2, created_by: this.cs.user_session.id };
          let el: HTMLElement = this.antbtnref.nativeElement as HTMLElement;
          el.click();
          //this.openmdl(this.bkmrmdlref);
        }
        if (text == "4") {
          this.annotslit = [];
          let el: HTMLElement = this.antviewref.nativeElement as HTMLElement;
          el.click();
          this.cs.popdragabale();
          // setTimeout(() => {
          //  $('#tbllistid').DataTable().columns.adjust();
          // }, 300);
          /*this.cs.postData({ sourceid: 'pageannotations', info: { pageid: this.cs.selpage_id } })
            .subscribe(data => {
              // console.log(JSON.stringify(data));
              this.annotslit = data['response'];
              setTimeout(() => {
                let el: HTMLElement = this.antviewref.nativeElement as HTMLElement;
                el.click();
              }, 300);
            }, error => console.log(error))*/
          //this.openmdl(this.bkmrmdlref);
        }
        /*if (text == "5") {
          // alert("in core 5");
          if (this.cs.etmcoresearch.length > 2) {
            this.cs.show_searchResults = true;
            this.cs.etmcore_searchresults = [];
            $('#searchlist_table').DataTable().ajax.reload();
          } else {
            this.cs.show_searchResults = false;
            this.cs.etmcore_searchresults = [];
          }
        }*/
      });
  }

  public triggerpdf() {
    // destroy dynamic table
    this.destroyDynamicTable();
    // process request
    var contentdt = $('#page_content').html();
    $('.ui-tabs-panel[aria-hidden="false"]').each(function (i, el) {
      contentdt = $(el).html();
    });
    this.printDataService.printContent({
      data: contentdt,
      type: PrintDataTypes.TYPE_PAGE,
    })
      .pipe(
        concatMap(_ => this.trackingService.trackPrintPage({
          page_id: this.cs.selpage_id,
          type: TrackingTypes.TYPE_PRINT_PDF,
          uid: this.cs.user_session.id
        }))
      )
      .subscribe(
        _ => {
          // re-enable table plugin 
          //this.initDynamicTable();
        },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Unable to process request.');
          // re-enable table plugin
          // this.initDynamicTable();
        }
      );
  }

  public deleteannot(id) {
    //  $('span#text_annotator' + id).contents().unwrap()
    /* setTimeout(() => {
       var tmppgdata = this.pgdesc.nativeElement.innerHTML;
       tmppgdata = (tmppgdata.replace(new RegExp(this.cs.apiUrl + "staticassets/contentdata/images/", 'g'), "{imgsevurl}")
         .replace(new RegExp(this.cs.apiUrl + "staticassets/contentdata/videos/", 'g'), '{videosevurl}'));
       this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
         .subscribe((data: any) => {
           //  alert(data.status+">>>????");
           if (data.status == 1) {

           } else {
             this.cs.openGrowl('', 'Status', 'Some error Occured');
           }
         });
     }, 300);*/
    this.cs.postData({ sourceid: 'delete_listing', info: { query: 'annotations', pdata: { id: 'id', value: id } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.annotsview.hide();
          this.cs.openGrowl('', 'Status', 'Annotation Deleted successfully');
          this.mdls.modalRef.hide();
        } else {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
        }
      });
  }
  openanotator_click(id) {
    this.cs.postData({
      sourceid: 'listingdetails',
      info: { query: 'annotationsview', pdata: { id: 'id', value: id }, selcolumns: ['id', 'title', 'page_id', 'description', 'annotation_type', 'created_by', 'creation_date', 'user_name'] }
    })
      .subscribe((data: any) => {
        //  console.log(JSON.stringify(data));
        //  console.log(">>>><<<<</////////////<<<<<<<<<<<");
        if (data.status == 1) {
          if (data['response']['created_by'] != '')
            this.selected_annotation = data['response'];
          setTimeout(() => {
            let el: HTMLElement = this.antviewdtref.nativeElement as HTMLElement;
            el.click();
          }, 300);
        }
      });

    /*  this.dtfilters['page_id']=id;
      setTimeout(() => {
      $('#tbllistid').DataTable().ajax.reload();
      },300);*/
    // alert("opened===="+id);
    /*  */
  }
  manageannotations(annotForm) {
    if (annotForm.valid) {
      this.annotdata.page_id = this.cs.selpage_id;
      const annotationEvent: ITrackAnnotationEvent = {
        annotationName: this.annotdata.title,
        event: TrackAnnotationEvent.TYPE_ANT_ADDED,
        privacy: this.annotdata.annotation_type
      };
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.annotdata, query: 'annotations', pdata: { id: 'id', value: this.annotdata['id'] } } })
        .pipe(
          concatMap(res => {
            return this.trackingService.trackAnnotationEvent({
              uid: this.cs.user_session.id,
              type: TrackingTypes.TYPE_ANNOTATIONS,
              data: JSON.stringify(annotationEvent),
            }).pipe(map(_ => res))
          })
        )
        .subscribe((data: any) => {
          if (data.status == 1) {
            this.mdls.modalRef.hide();
            this.cs.annots_count++;
            if (this.annotdata['annotation_type'] == 1) {
              this.cs.AnnotationsChange({ note_anots_count: ++this.cs.note_anots_count, feedback_anots_count: this.cs.feedback_anots_count })
            }
            if (this.annotdata['annotation_type'] == 2) {
              this.cs.AnnotationsChange({ note_anots_count: this.cs.note_anots_count, feedback_anots_count: ++this.cs.feedback_anots_count })
            }
            /*  $('.new_annotator').attr({ id: data.response, title: 'View Annotation' });
              if (this.annotdata['annotation_type'] == 1) {
                $('.new_annotator').addClass('text_annotator').removeClass('new_annotator');
              } else {
                $('.new_annotator').removeClass('new_annotator');
              }*/

            // save annotation id to HTMLNode
            $('.new_annotator').attr({
              "data-node-id": data.response,
              annot_type: this.annotdata['annotation_type'],
              "data-annot-type": this.annotdata['annotation_type']
            });
            // fix: annotation doesn't highlight on creation.
            // this is because we assign appr CSS in `triggerall_pageactions`
            if (this.annotdata['annotation_type'] == 2) {
              $('.new_annotator').addClass('public_annotation_item');
            }
            // finally, remove `new_annotator` class
            $('.new_annotator').removeClass('new_annotator');
            if (this.annotdata['id'] == '') {
              var tmppgdata = this.pgdesc.nativeElement.innerHTML;
              tmppgdata = (tmppgdata
                // .replace(new RegExp(this.cs.apiUrl + "staticassets/contentdata/images/", 'g'), "{imgsevurl}")
                // .replace(new RegExp(this.cs.apiUrl + "staticassets/contentdata/videos/", 'g'), '{videosevurl}')
                .replace(new RegExp(this.cs.apiUrl, 'g'), '{sevurl}'));
              //   console.log(tmppgdata);
              //  console.log("========");
              this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
                .subscribe((data: any) => {
                  //  alert(data.status+">>>????");
                  if (data.status == 1) {
                    this.cdr.detectChanges();
                    this.showantform = false;
                    /*this.elRef.nativeElement.querySelectorAll('.text_annotator').forEach(b => {
                      b.addEventListener('click', (event) => this.openanotator_click(b.getAttribute("id")));
                    })*/

                    this.annotdata = { id: '', title: '', page_id: 0, description: '', annotation_type: 1, created_by: this.cs.user_session.id };
                    this.cs.openGrowl('', 'Status', 'Added successfully');
                  }
                })
            } else {
              this.cdr.detectChanges();
              this.showantform = false;
              /*this.elRef.nativeElement.querySelectorAll('.text_annotator').forEach(b => {
                b.addEventListener('click', (event) => this.openanotator_click(b.getAttribute("id")));
              })*/
              this.annotdata = { id: '', title: '', page_id: 0, description: '', annotation_type: 1, created_by: this.cs.user_session.id };
              this.cs.openGrowl('', 'Status', 'Saved successfully');
            }
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        });
    } else {
      this.cs.openGrowl('', 'Status', 'Fill out all Mandatory Fields');
    }
  }

  // Dynamic hotspot
  postAddWordExplainer(data) {
    // update local ref of explainer data
    this.explainerdata = data
    // 1. Update HTML to show new UI
    // 2. Send POST request with updated HTML content (in pages table)
    const type = data.content_type
    const id = data.id
    let reqClass = '', reqTitle = '';
    if (type == 3) {
      reqClass = 'innercontent'
      reqTitle = '';
    } else if (type == 1) {
      reqClass = 'innerimage'
      reqTitle = ''
    } else if (type == 2) {
      reqClass = 'innervideo'
      reqTitle = ''
    }
    const reqEl = $('.new_annotator')
    // get selected text
    const selectedText = reqEl.text()
    // need to replace 'span' with 'a' elements
    reqEl.replaceWith(`<a class="${reqClass}" data="${id}">${selectedText}</a>`)
    // update server db with new content
    var tmppgdata = this.pgdesc.nativeElement.innerHTML;
    tmppgdata = (tmppgdata
      // .replace(new RegExp(this.cs.apiUrl + "static/explainer/images/", 'g'), "{imgsevurl}")
      // .replace(new RegExp(this.cs.apiUrl + "static/explainer/videos/", 'g'), '{videosevurl}')
      .replace(new RegExp(this.cs.apiUrl, 'g'), '{sevurl}'));
    //   console.log(tmppgdata);
    //  console.log("========");
    // update server
    this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
      .subscribe((resp: any) => {
        //  alert(data.status+">>>????");
        if (resp.status == 1) {
          this.triggerall_pagactions()
          const edMode = data.mode == true ? 'Edited' : 'Added'
          this.cs.openGrowl('', 'Status', `Hotspot ${edMode} successfully`);
        }
      })
  }

  // close word explainer
  closeWE(resetData = true) {
    // this.explainermdl.hide()
    if (resetData)
      this.explainerdata = { id: '', content_type: '', content_title: '', content: '' };
  }

  // edit dynamic hotspot
  editWE(id) {
    // close current dialog
    this.closeWE(false)
    // show edit dialog
    this.wmEmitter.next({
      type: 'edit_mode',
      data: id
    })
  }
  // del dynamic hotspot
  delWE(id) {
    // reset WE <a> tag to <span>
    const el = $(`[data=${id}]`)
    const text = el.text()
    el.replaceWith(`<span>${text}</span>`)
    // update server db with new content
    var tmppgdata = this.pgdesc.nativeElement.innerHTML;
    tmppgdata = (tmppgdata
      // .replace(new RegExp(this.cs.apiUrl + "static/explainer/images/", 'g'), "{imgsevurl}")
      // .replace(new RegExp(this.cs.apiUrl + "static/explainer/videos/", 'g'), '{videosevurl}')
      .replace(new RegExp(this.cs.apiUrl, 'g'), '{sevurl}'));
    //   console.log(tmppgdata);
    //  console.log("========");
    // remove from db
    return this.cs.postData({ sourceid: 'delete_listing', info: { query: 'wordsexplainer', pdata: { id: 'id', value: id } } })
      .pipe(
        concatMap((res: any) => {
          // update server
          return this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
            .pipe(map(_ => res))
        })
      )
      .subscribe(
        (resp: any) => {
          // alert(resp.status+">>>????");
          if (resp.status == 1) {
            this.cs.openGrowl('', 'Status', 'Hotspot Deleted successfully.')
            this.triggerall_pagactions()
          }
        },
        console.error
      )
  }


  // Hyperlink
  postAddHyperlink(data: IHyperlinkAddActionData) {
    // 1. Update hyperlinks table
    // 2. Update HTML to show new UI
    // 3. Send POST request with updated HTML content (in pages table)
    const id = data.to_page
    if (!data.mode) {
      // add mode
      const reqEl = $('.new_annotator')
      // get selected text
      const selectedText = reqEl.text()
      // need to replace 'span' with 'a' elements
      reqEl.replaceWith(`<a class="innerpage" node-id="${data.node_id}" data="${id}">${selectedText}</a>`)
    } else if (data.mode) {
      // edit mode
      const reqEl = $(`[node-id=${data.node_id}]`)
      // update `data` attr
      reqEl.attr('data', data.to_page)
    }

    // update server db with new content
    var tmppgdata = this.pgdesc.nativeElement.innerHTML;
    tmppgdata = (tmppgdata
      // .replace(new RegExp(`${this.cs.apiUrl}static/explainer/images/`, 'g'), "{imgsevurl}")
      // .replace(new RegExp(`${this.cs.apiUrl}static/explainer/videos/`, 'g'), '{videosevurl}')
      .replace(new RegExp(this.cs.apiUrl, 'g'), '{sevurl}'));
    //   console.log(tmppgdata);
    //  console.log("========");
    // update server
    this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
      .subscribe((resp: any) => {
        //  alert(data.status+">>>????");
        if (resp.status == 1) {
          /**
           * RELOAD CURRENT PAGE for changes to apply
           * Note: This is not needed in WE as updated content is in table.
           * and in HTML, we simply link to table's id
           * But in hyperlink, we track hyperlinks with node-id
           * and the actual page linking logic is set in `data` attribute.
           */
          this.getpagecontent(this.getPageId())
          this.triggerall_pagactions()
          const edMode = data.mode ? 'edited' : 'added'
          this.cs.openGrowl('', 'Status', `Hyperlink ${edMode} successfully`);
        }
      }, err => alert(err))
  }

  postDelHyperlink(data) {
    console.log()
    if (data['status'] == 1) {
      // remove HTML code.
      const reqEl = $(`[node-id=${data.node_id}]`);
      const text = reqEl.text();
      reqEl.replaceWith(`<span>${text}</span>`);
      // update server db with new content
      var tmppgdata = this.pgdesc.nativeElement.innerHTML;
      tmppgdata = (tmppgdata
        // .replace(new RegExp(`${this.cs.apiUrl}static/explainer/images/`, 'g'), "{imgsevurl}")
        // .replace(new RegExp(`${this.cs.apiUrl}static/explainer/videos/`, 'g'), '{videosevurl}')
        .replace(new RegExp(this.cs.apiUrl, 'g'), '{sevurl}'));
      //   console.log(tmppgdata);
      //  console.log("========");
      // update server
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: { content: tmppgdata }, query: 'pages', pdata: { id: 'id', value: this.cs.selpage_id } } })
        .subscribe(
          (resp: any) => {
            // alert(resp.status+">>>????");
            if (resp.status == 1) {
              this.cs.openGrowl('', 'Status', 'Hyperlink deleted successfully.')
              this.triggerall_pagactions()
            }
          },
          console.error
        );
    }
  }

  hyperlinkClickHandler(to_page: number, id: string, force_open_link = false) {
    if (this.cs.user_session.user_type != 0 || force_open_link || id == undefined) {
      this.cs.navigateToPage(to_page);
    } else {
      // only superadmin can modify/del hyperlink
      // Launch preview component
      const ref = this.modalS.show(HyperlinkPreviewComponent, {
        class: this.cs.default_theme,
        initialState: {
          myData: {
            id,
            content: '',
            from_page: -1,
            to_page: -1
          }
        }
      });
      const content = ref.content as HyperlinkPreviewComponent;
      content.actionType = HyperlinkActionTypes.TYPE_VIEW;
      content.modalRef = ref;
      this.cs.popdragabale();
    }
  }

  removespans() {
    alert("dfkjdk");
    // $(".newant").replaceWith(function () { return $(this).contents(); });

    //  $('span.new_annotator').contents().unwrap();
  }

  public editannotation(id) {
    this.ant_form_title = "Update Annotation";
    this.ant_btn_title = "UPDATE";
    this.cs.postData({
      sourceid: 'listingdetails',
      info: { query: 'annotations', pdata: { id: 'id', value: id }, selcolumns: ['id', 'title', 'page_id', 'description', 'annotation_type', 'created_by', 'creation_date'] }
    }).subscribe((data: any) => {
      //  console.log(JSON.stringify(data));
      //  console.log(">>>><<<<</////////////<<<<<<<<<<<");
      if (data.status == 1) {
        this.annotdata = data['response'];

        this.annotsview.hide();
        this.showantform = true;
        this.antbtnref.nativeElement.click();
      }
    });
  }
  public addAnnotation(): void {
    this.ant_form_title = "Add Annotation";
    this.ant_btn_title = "SUBMIT";
    this.annotdata = { id: '', title: '', page_id: 0, description: '', annotation_type: 1, created_by: this.cs.user_session.id };
    this.annotdata.title = $('span.new_annotator').text();
    this.antbtnref.nativeElement.click();
    this.showantform = true;
    this.cs.removeMarkTags();
  }

  public addHotspot() {
    this.wmEmitter.next({
      type: 'add_mode'
    });
    this.cs.removeMarkTags();
  }

  public addHyperlink() {
    const text = $(".new_annotator").text();
    const modalRef = this.modalS.show(HyperlinkAddUpdComponent, {
      initialState: {
        editMode: false,
        myData: {
          content: text,
          id: '',
          from_page: this.cs.selpage_id,
          to_page: -1
        }
      },
      class: this.cs.default_theme
    });
    const content = modalRef.content as HyperlinkAddUpdComponent;
    content.modalRef = modalRef;
    this.cs.removeMarkTags();
  }

  public print_preview = 0;
  public print_date = new Date();
  public pagecontent = { content: '', title: '', page_category: 0, file_upload: '' };
  previousRoute: string;
  public disablebackbtn = 1;
  public pdfSrc: string;
  public pdfloaded = 0;
  public display_wm = 0;
  //public  pdfdialog = new ElectronService().remote.dialog;


  //public
  public tdata = { id: '', user_id: this.cs.user_session.id, page_id: 0 };
  public bkmtdata = { id: '', page_id: 0, bookmark_name: '', created_by: this.cs.user_session.id };
  public pagedisplaydata = "";
  public sanatizelink(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  mobileCheck() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window['opera']);
    return check;
  }

  triggerall_pagactions() {
    const self = this;
    setTimeout(() => {
      // highlight all "Notes to Admin" annotations
      $('span[annot_type="2"]').addClass('public_annotation_item');
      $('.text_annotator').each(function (_) {
        $(this).on("click", function () {
          // exit fullscreen
          if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
          // process request
          self.openanotator_click($(this).attr('id'));
        });
      });
      $('.innercontent').each(function (_) {

        const id = parseInt($(this).attr('data'));

        // hover logic
        $(this).on('mouseover', function () {
          // process request
          self.cs.postData({
            sourceid: 'listingdetails', info: {
              query: 'wordsexplainer', pdata: { id: 'id', value: id },
              selcolumns: ['id', 'content']
            }
          })
            .toPromise()
            .then(i => i && i['response'] || null)
            .then(response => {
              if (!response) return;
              const { content } = response;
              const elRef = $(this).get(0);
              // if previous instance exists, show content then return
              const tippyRef = elRef['_tippy'] as TippyInstance;
              const isMobileBrowser = self.mobileCheck();
              if (tippyRef && !isMobileBrowser) {
                // close any and all Tippy instances except current one.
                hideAll({ exclude: tippyRef });
                // show existing tippyRef if any AND content hasn't changed.
                const _prevValue = $('p', tippyRef.props.content.toString()).text();
                const isContentNotModifed = content == _prevValue;
                if (!tippyRef.state?.isVisible && isContentNotModifed) {
                  tippyRef.show();
                  return;
                } else {
                  tippyRef.destroy();
                }
              }
              // show content
              const template = `
                <span id="hotspot-preview-container" class="col" style="user-select: none;">
                  <h4>${$(this).text()}</h4>
                  <p>${content}</p>
                </span>
              `;
              self.tippyS.create(elRef, template, { touch: false });
            });
        });

        $(this).on('mouseleave', function (e) {
          const instance = $(this).get(0);
          if (!instance) return;
          instance['_tippy']?.hideWithInteractivity(e);
        });

        $(this).on("click", function () {
          // exit fullscreen
          if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
          // process request
          self.showExplainer(id);
        });
      });
      $('.innerimage').each(function (_) {
        // fix spawning duplicate image viewer plugin
        $(this).off('click');
        // process request
        const id = parseInt($(this).attr('data'));
        self.cs.postData({
          sourceid: 'listingdetails', info: {
            query: 'wordsexplainer', pdata: { id: 'id', value: id },
            selcolumns: ['id', 'content_path_type', 'content']
          }
        })
          .toPromise()
          .then(i => i && i['response'] ? i['response'] : null)
          .then(response => {
            // throws error when wordexplainer deleted from db but HTML code still remains
            if (!response) return;
            const { content, content_path_type } = response;

            $(this).on('mouseleave', function (e) {
              const instance = $(this).get(0);
              if (!instance) return;
              instance['_tippy']?.hideWithInteractivity(e);
            });

            // assign hover logic
            $(this).on('mouseover', function () {
              const elRef = $(this).get(0);
              // if previous instance exists, show content then return
              const tippyRef = elRef['_tippy'] as TippyInstance;
              const isMobileBrowser = self.mobileCheck();
              if (tippyRef && !isMobileBrowser) {
                // close any and all Tippy instances except current one.
                hideAll({ exclude: tippyRef });
                // show existing tippyRef if any AND content hasn't changed.
                const _prevValue = $('p', tippyRef.props.content.toString()).text();
                const isContentNotModifed = content == _prevValue;
                if (!tippyRef.state?.isVisible && isContentNotModifed) {
                  tippyRef.show();
                  return;
                } else {
                  tippyRef.destroy();
                }
              }
              // process request
              let template = '<h2>Content Not supported</h2>';
              if ([0, 1].includes(content_path_type)) {
                template = `
                <span id="hotspot-preview-container">
                  <p class="hotspot-preview-title">${$(this).text()}</p>
                  <img class="img-responsive" src="${content_path_type == 0 ? `${self.cs.imageurl}/explainer/images/${content}` : `${self.cs.serverip}/${content}`}">
                </span>`;
              } else if (content_path_type == 2) {
                // THIS CODE IS UNTESTED!!!
                const ul = document.createElement('ul');
                const contentArr: string[] = content.split(',');
                if (contentArr.length == 0) return;
                contentArr.forEach(el => {
                  el = el.trim(); // remove spaces
                  const li = document.createElement('li');
                  const img = document.createElement('img');
                  img.src = `${self.cs.serverip}/staticassets/${el}`;
                  li.appendChild(img);
                  ul.appendChild(li);
                });
                template = ul.innerHTML;
              }
              // create instance and show
              self.tippyS.create(elRef, template, { touch: false });
            });

            $(this).on("click", function () {
              // remove hover preview on click
              $(this).get(0)['_tippy']?.destroy();
              // exit fullscreen
              if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
              // process request 
              const id = parseInt($(this).attr('data'));
              // show edit/del options for admin, superadmin
              if (self.cs.user_session.user_type < 2) {
                self.showExplainer(id);
              } else {
                // fetch image url
                if ([0, 1].includes(content_path_type)) {
                  const img = document.createElement('img');
                  img.src = content_path_type == 0 ? `${self.cs.imageurl}/explainer/images/${content}` : `${self.cs.serverip}/${content}`;
                  img.onerror = function () {
                    // setTimeout is needed to delay image viewer
                    // hide event else viewer's canvas overlay which spreads
                    // all over the page blocks user input to anything else on page
                    setTimeout(() => {
                      img['viewer'].hide();
                      self.cs.openGrowl('', 'Status', "Content load error");
                    }, 300);
                  }
                  self.initImageViewerPlugin(img);
                  img['viewer'].show();
                } else if (content_path_type == 2) {
                  let canShowError = false;
                  const ul = document.createElement('ul');
                  const contentArr: string[] = content.split(',');
                  if (contentArr.length == 0) return;
                  contentArr.forEach(el => {
                    el = el.trim(); // remove spaces
                    const li = document.createElement('li');
                    const img = document.createElement('img');
                    img.src = `${self.cs.serverip}/staticassets/${el}`;
                    img.onerror = function () {
                      // setTimeout is needed to delay image viewer
                      // hide event else viewer's canvas overlay which spreads
                      // all over the page blocks user input to anything else on page
                      setTimeout(() => {
                        if (canShowError) {
                          ul['viewer'].hide();
                          self.cs.openGrowl('', 'Status', "Content load error");
                        }
                        canShowError = false;
                      }, 300);
                    }
                    li.appendChild(img);
                    ul.appendChild(li);
                  });
                  self.initImageViewerPlugin(ul);
                  ul['viewer'].show();
                }
              }
            });
          })
          .catch(err => {
            console.error(err);
            self.cs.openGrowl('', 'Status', 'Preview load error');
          });
      });
      $('.innervideo').each(function (_) {

        const id = parseInt($(this).attr('data'));

        $(this).on('mouseenter', function () {
          // process request
          self.cs.postData({
            sourceid: 'listingdetails', info: {
              query: 'wordsexplainer', pdata: { id: 'id', value: id },
              selcolumns: ['id', 'content', 'content_path_type']
            }
          })
            .toPromise()
            .then(i => i && i['response'] || null)
            .then(response => {
              if (!response) return;
              const { content, content_path_type } = response;
              const elRef = $(this).get(0);
              // destroy others
              $('div[data-tippy-root]').each((_, e) => { if (e.id != elRef.id) e['_tippy']?.destroy(); });
              // if previous instance exists, show content then return
              const tippyRef = elRef['_tippy'] as TippyInstance;
              const isMobileBrowser = self.mobileCheck();
              if (tippyRef && !isMobileBrowser) {
                window['t'] = tippyRef;
                // close any and all Tippy instances except current one.
                // hideAll({ exclude: tippyRef });
                if (!tippyRef.state?.isVisible) {
                  tippyRef.show();
                  setTimeout(() => {
                    ($('#hotspot-preview-video')[0] as HTMLVideoElement)?.play();
                  }, 150);
                  return;
                } else {
                  tippyRef.destroy();
                }
              }
              // show content
              const template = `
              <span id="hotspot-preview-container">
                <p class="hotspot-preview-title">${$(this).text()}</p>
                <video id="hotspot-preview-video" width="300" class="embed-responsive-item" controls autoplay  controlsList="nodownload" playsinline="true" disablePictureInPicture>
                  <source src="${content_path_type == 0 ? `${self.cs.imageurl}/explainer/videos/${content}` : `${self.cs.serverip}/${content}`}" type="video/mp4">
                </video>
              </span>
                `;
              self.tippyS.create(elRef, template, { touch: false });
            });
        });

        $(this).on('mouseleave', function (e: any) {
          const elRef = $(this).get(0);
          if (!elRef) return;
          const tippyRef = elRef['_tippy'] as TippyInstance;
          if (!tippyRef) return;
          tippyRef.hideWithInteractivity(e);
        });

        $(this).on("click", function () {
          // exit fullscreen
          if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
          // process request
          self.showExplainer(id);
        });
      });
      $('.glossary').each(function (_) {
        $(this).on("click", function () {
          // exit fullscreen
          if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
          // process request
          const id = parseInt($(this).attr('data'));
          self.showGlossary(id);
        });
      });
      // hyperlink items
      $('.innerpage').each(function (_) {
        // fix duplicate preview windows on add/upd events triggered
        // TODO: fix the cause and not the symptom
        $(this).off('click');
        // process request
        const to_page = parseInt($(this).attr('data'));
        const id = $(this).attr('node-id');
        $(this).on("click", function () {
          // exit fullscreen
          if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
          // process request
          self.hyperlinkClickHandler(to_page, id);
        });
      });
      // Init image viewer plugin
      this.initImageViewerPlugin();
      $('.text_annotator').attr('title', 'view annotation');
      $('.innercontent').attr('title', '');
      $('.innerimage').attr('title', '');
      $('.innervideo').attr('title', 'view animation/video');
      $('.glossary').attr('title', 'view full form');
      $('.parent_list li').on('click', function () {
        // $(this).siblings().children().hide();
        $(this).children().toggle();
      });
      //$('.image').viewer({ navbar: false, backdrop: true });
      /* var $image = $('.image');
        $image.viewer({ navbar: false, backdrop: true });*/

      $('map')['imageMapResize']();
      $('.mapimg')['maphilight']({ fade: true, fillOpacity: 0.2, strokeColor: 'ff0000' });
      $('.imgmt').on('click', function (_) {
        var id = $(this).attr("id").split('_')[1];
        $('#imgh_' + id).trigger('mouseover');
        $('#imgt_' + id).trigger('mouseover');
      }).on('mouseout', function (_) {
        var id = $(this).attr("id").split('_')[1];
        $('#imgh_' + id).trigger('mouseout');
        $('#imgt_' + id).trigger('mouseout');
      }).on('click', function (e) { e.preventDefault(); });
      $('.imgt').on('click', function (_) {
        var id = $(this).attr("id").split('_')[1];
        // alert(id+">>>>>>>????");
        $('#imgh_' + id).trigger('mouseover');
        $('#imgmt_' + id).addClass('hottext');
      }).on('mouseout', function (_) {
        var id = $(this).attr("id").split('_')[1];
        $('#imgmt_' + id).removeClass('hottext');
        $('#imgh_' + id).trigger('mouseout');
      }).on('click', function (e) { e.preventDefault(); });
      $('.imgh').on('click', function (_) {
        var id = $(this).attr("id").split('_')[1];
        //alert(id+">>>>>>>????");
        $('#imgt_' + id).trigger('mouseover');
        $('#imgmt_' + id).addClass('hottext');
      }).on('mouseout', function (_) {
        var id = $(this).attr("id").split('_')[1];
        $('#imgmt_' + id).removeClass('hottext');
        $('#imgt_' + id).trigger('mouseout');
      }).on('click', function (e) { e.preventDefault(); });
      $('#page_content').on('mouseup', function (_) {
        $.when($("span.text_annotator").removeClass("new_annotator")).done(function () {
          $.when($('span.new_annotator').contents().unwrap()).done(function () {
            setTimeout(() => {
              rangy.getSelection();
              rangy.createCssClassApplier('new_annotator').applyToSelection();
              const isOkay = self.checkIfTxtSelectionValid()
              if (!isOkay) {
                $('.new_annotator').removeClass('new_annotator');
                document.getSelection().removeAllRanges()
                self.cs.openGrowl('', 'Status', 'Selection not allowed over existing data.');
              }
            }, 300);
          });
        });
      });
      $('.moredata .readmore').on('click', function () {
        // $(this).siblings().children().hide();
        //  $('.moredata .readmore').toggle();
        $('.moredata .moretext').toggle();
        $('.moredata .readless').toggle();
      });
      $('.moredata .readless').on('click', function () {
        // $(this).siblings().children().hide();
        $('.moredata .readmore').toggle();
        $('.moredata .moretext').toggle();
        $('.moredata .readless').toggle();
      });

      $(".tabs")['tabs']({
        neighbors: {
          prev: $('.btnMoveLeftTab'),
          next: $('.btnMoveRightTab')
        }
      });

      // Dynamic table
      //  this.initDynamicTable();

      // fix width issue on TOC hide
      this.tableWidthAdjustSub$ = this.cs.triggerTableWidthAdjust$
        .pipe(delay(500))
        .subscribe(_ => {
          $('#tbllistid').DataTable().columns.adjust();
        })
    }, 300)

  }

  /*initDynamicTable() {
    try {
      if (this.cs.sel_catid == 1) {
        $('.table').DataTable(<ADTSettings>{
          dom: 'ltp',
          columnDefs: [
            { targets: '_all', defaultContent: '' }
          ],
          pageLength: 10,
          searching: false,
          sorting: false,
          ordering: false,
          destroy: true,
          scrollY: "calc(100vh - 310px)",
          scrollX: true,
          scrollCollapse: false,
          paging: false
        });
      }
    } catch (e) {
      console.warn('Unable to load table plugin for page content.');
      console.log(e);
    }
  }*/

  destroyDynamicTable() {
    try {
      $('#page_content .table').DataTable().destroy();
    } catch (e) {
      console.warn('Unable to load table plugin for page content.');
      console.log(e);
    }
  }

  initImageViewerPlugin(selector: string | HTMLElement | HTMLElement = '.main-content1 img, .main-content1 area') {
    try {
      const viewerOptions = {
        inline: false,
        navbar: false,
        title: false,
        className: this.cs.default_theme,
        toolbar: {
          zoomIn: true,
          zoomOut: true,
          reset: true,
          prev: false,
          play: true, // used as fullscreen option
          next: false,
          rotateLeft: true,
          rotateRight: true,
          flipHorizontal: true,
          flipVertical: true,

        },
      };
      if (typeof selector == 'string') {
        $(selector).each((_, el) => {
          new Viewer(el, viewerOptions);
        });
      } else if (selector instanceof HTMLUListElement) {
        new Viewer(selector, {
          ...viewerOptions,
          navbar: true
        });
      } else if (selector instanceof HTMLImageElement) {
        new Viewer(selector, viewerOptions);
      }
    } catch (error) {
      console.error(error)
    }
  }
  checkIfTxtSelectionValid() {
    let list = new Array<HTMLElement>()
    const blacklistCSS = ['innerpage', 'innercontent', 'innerimage', 'innervideo']
    document.querySelectorAll('.new_annotator')
      .forEach((el: HTMLElement) => list.push(el))
    list = lodash.flatten(
      list.map(
        el => Array.from(el.parentElement.classList)
          .map(el => !blacklistCSS.includes(el))
      )
    )
    return list.length == 0;
  }
  public updatepagecon(data) {
    if (this.pagecontent['page_category'] == 2 || this.pagecontent['page_category'] == 4) {
      this.pdfSrc = this.cs.apiUrl + "static/manuals/" + this.pagecontent.file_upload;
      /*this.downloadFile(this.cs.apiUrl + "static/manuals/" + this.pagecontent['file_upload']).subscribe(
       (res) => {
           this.manualpdfViewerAutoLoad.pdfSrc = res; // pdfSrc can be Blob or Uint8Array
          this.manualpdfViewerAutoLoad.refresh(); // Ask pdf viewer to load/refresh pdf
       });*/

      this.loadpdf = this.pagecontent['page_category'] == 2;

    } else if (this.pagecontent['page_category'] == 3) {

      setTimeout(() => {
        //  alert(this.cs.apiUrl + "staticassets/drawings/" + this.pagecontent['image_upload']);
        const inputStr = this.pagecontent['image_upload'];
        if (!inputStr.includes(',')) {
          this.drawingsrc = this.cs.apiUrl + "staticassets/drawings/" + this.pagecontent['image_upload'];
        } else {
          // array based drawings
          try {
            const jsonObj: string[] = inputStr.split(',');
            this.drawingsList = jsonObj.map(e => {
              e = e.trim();
              const hyphenIndex = e.lastIndexOf('-');
              return {
                src: this.cs.apiUrl + "staticassets/drawings/" + e,
                title: e.slice(0, hyphenIndex)
              }
            });
          } catch (_) { console.error(_) }
        }
        this.appref.tick();
        // Init image viewer
        this.initImageViewerPlugin();
      }, 100);


    } else {
      this.loadpdf = false;
      //var temdt = (data.replace(new RegExp('{imgsevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/images/")).replace(new RegExp('{videosevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/videos/");

      this.pagedisplaydata = data
        // .replace(new RegExp('{imgsevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/images/"))
        // .replace(new RegExp('{videosevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/videos/")
        .replace(new RegExp('{sevurl}', 'g'), this.cs.apiUrl);
      this.cdr.detectChanges();
      this.triggerall_pagactions();
    }
    const navId = this.getPageId()
    const navRegex = /\/page\/\d*/;
    if (navRegex.test(this.router.url)) {
      //alert(navId+"/////");
      this.cs.updateTreeModelSubject.next(navId)
    }
  }

  private getPageId() {
    const url = this.router.url.toString()
    const y = url.split('/');
    return parseInt(y[y.length - 1]);
  }

  showGlossary(id: number) {
    // alert(id);
    this.selgossarydata = { id: '', glossary_type: 0, golssary_name: '', description: '' };
    this.cs.postData({
      sourceid: 'listingdetails',
      info: { query: 'glossary', pdata: { id: 'id', value: id }, selcolumns: Object.keys(this.selgossarydata) }
    }).subscribe((data: any) => {
      // console.log(JSON.stringify(data));
      //  console.log(">>>><<<<</////////////<<<<<<<<<<<");
      if (data.status == 1) {
        this.selgossarydata = data['response'];
        this.cdr.detectChanges();
        this.glossarymdl.show();
      }
    });

  }
  showExplainer(id: number) {
    // alert(id);
    this.explainerdata = { id: '', content_type: '', content_title: '', content: '' };
    /*this.cs.postData({ sourceid: 'wordexplainer', info: { id: id } })
      .subscribe(data => {
        //   alert(JSON.stringify(data));
        if (data['response'].length > 0) {
          this.explainerdata = data['response'][0];
          this.cdr.detectChanges();
          this.explainermdl.show();
          /*setTimeout(() => {
          $('#explainerimg').viewer({ navbar: false, backdrop: true,inline:true });
          },100);*
        }
      })*/
    this.wmpEmitter.next({
      type: 'type_init',
      data: id
    })
  }
  getpagecontent(id: number) {
    // console.log(">>>>>>????"+JSON.stringify( this.previousRoute));
    this.cs.page_breadcrumb = [];
    this.drawingsrc = '';
    this.drawingsList = [];
    this.loadpdf = false;
    this.cs.updatepdfoptions();
    //this.pdfSrc = "";
    this.pagedisplaydata = "";
    this.cs.isbookmarked = 0;
    this.cs.selpage_id = id;
    //console.log(this.cs.selpage_id+"????"+this.cs.user_session.id+"????"+this.cs.user_session.user_type);
    this.cs.postData({ sourceid: 'calldbproc', info: { procname: 'pagecontent_proc', vals: [this.cs.selpage_id, this.cs.user_session.id, this.cs.user_session.user_type] } }).pipe(
      concatMap((data: any) => {
        if (data.status == 1) {
          this.pagecontent = data.response[0][0];
          this.related_content = JSON.parse(this.pagecontent['related_content'])?.map(el => {
            el['content_name'] = this.cs.related_contents.find(e => e.id == el['content_id'])?.name;
            return el;
          });
          this.cs.note_anots_count = data['response'][1][0]['note_anots_count'];
          this.cs.feedback_anots_count = data['response'][5][0]['feedback_anots_count'];
          // = data.response[1][0]['anots_count'];
          var tembdcrumb = data['response'][4];
          // Find module to display in breadcrumb acc to selected module id
          const selectedModuleInfo = tembdcrumb.find(e => e.module_id == this.cs.selmodule_id);
          this.cs.page_mcbreadcrumb = selectedModuleInfo;
          // Set module name when breadcrumbs are set.
          // Note: required as it sets module name top on TOC on first page refresh 
          this.cs.selmodule_name = selectedModuleInfo['module_name'];
          // console.log("//////////////////////"+JSON.stringify(this.cs.page_mcbreadcrumb));
          // JSON.stringify(this.cs.page_mcbreadcrumb);
          this.cs.page_breadcrumb = data['response'][3];
          this.dtfilters['page_id'] = this.cs.selpage_id;
          //alert("pavfdgfd");
          setTimeout(() => {
            $('#tbllistid').DataTable().ajax.reload();
          }, 300);

          if (data.response[2].length > 0) {
            this.bookmarkeid = data.response[2][0]['id'];
            this.bookmarkName = data.response[2][0]['bookmark_name'];
            this.cs.isbookmarked = 1;
          } else {
            this.bookmarkeid = 0;
            this.bookmarkName = '';
            this.cs.isbookmarked = 0;
          }
          this.updatepagecon(this.pagecontent.content);
          // inform TOC to highlight appr node
          this.cs.updateTreeModelSubject.next(this.cs.selpage_id);

          // console.log(`PAGE ID: `+this.cs.selpage_id);
          // When page loading is done, emit track event
          return this.trackingService.trackPageAccess({
            uid: this.cs.user_session.id,
            page_id: this.cs.selpage_id,
            type: TrackingTypes.TYPE_PAGE_ACCESS
          })
            // delay is needed as page_id updates in setTimeout
            .pipe(
              // CNP: `delayUntil` logic in RXJS 6
              // https://stackoverflow.com/a/53911774
              delayWhen(_ => this.cs.selpage_id != 0 ? interval(0) : interval(800))
            );
        }
      }))
      .subscribe(_ => { }, err => {
        console.error(err);
      });
  }

  printpdf() {
    this.cs.postData({
      sourceid: 'printcontent', info: { parentid: this.cs.selpage_id, actiontype: 'print', sevurl: this.cs.apiUrl }
    }).subscribe(data => {
      if (data['status'] == '1') {
        'use strict';
        //const BrowserWindow = require(`electron`).remote.BrowserWindow;
        //const path = require(`path`);
        //const qs = require(`query-string`);
        //const param = qs.stringify({ file: data['response']['filename'] });
        //const modalPath = path.join(this.cs.apiUrl + '/static/pdfjs/web/viewer.html?' + param);
        // console.log(modalPath);
        /*let pdfWindow = new BrowserWindow({
          width: 600,
          height: 1000,
          webPreferences: {
            nodeIntegration: false,
            webSecurity: false
          }
        });*/
        //pdfWindow.on('closed', function () { pdfWindow = null });
        // pdfWindow.loadURL(modalPath);
        // pdfWindow.show();
        // pdfWindow.webContents.openDevTools();
      } else {
        this.cs.openGrowl('', "Status", "Some error ocured");
      }
    }, error => alert(error))
  }

  opengenpdf() {
    //  alert("rigeevdft opne gen pdf");
    setTimeout(() => {
      //var fs = require('fs');
      // alert(this.cs.printurl + '/print_preview.pdf');
      var that = this;
      // var request = require('request');
      //request.get(this.cs.printurl + '/print_preview.pdf', function (error, response, body) {
      //  console.log(JSON.stringify(response));
      //    console.log(JSON.stringify(error));
      /*if (!error && response.statusCode == 200) {
        that.ngUnsubscribe.next();
        that.ngUnsubscribe.complete();
        // console.log("file eistis=======");
        const BrowserWindow = require(`electron`).remote.BrowserWindow;
        let pdfWindow = new BrowserWindow({
          width: 600,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            webSecurity: false
          }
        });
        pdfWindow.loadURL(path.join(that.cs.apiUrl + '/static/pdfjs/web/viewer.html?' + qs.stringify({ file: that.cs.printurl + '/print_preview.pdf' })));
        pdfWindow.show();
        pdfWindow.on('closed', function () { pdfWindow = null });
      } else {
        this.opengenpdf();
      }
    });*/
    }, 2000);
  }

  managebookmarks(annotForm) {
    if (annotForm.valid) {
      this.bkmtdata.page_id = this.cs.selpage_id;
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.bkmtdata, query: 'bookmarks', pdata: { id: 'id', value: '' } } })
        .pipe(
          switchMap(res => {
            const bookmarkEvent: ITrackBookmarkEvent = {
              bookmarkName: this.bkmtdata.bookmark_name,
              event: TrackBookmarkEvent.TYPE_BKM_ADDED
            }
            return this.trackingService.trackBookmarkEvent({
              uid: this.cs.user_session.id,
              type: TrackingTypes.TYPE_BOOKMARKS,
              data: JSON.stringify(bookmarkEvent),
            }).pipe(map(_ => res))
          })
        )
        .subscribe((data: any) => {
          if (data.status == 1) {
            this.cs.isbookmarked = 1;
            this.bookmarkeid = data.response;
            this.mdls.modalRef.hide();
            this.cs.openGrowl('', 'Status', 'Bookmarked successfully');
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        });
    } else {

      // this.cs.openGrowl('','Status','Fill out all Mandatory Fields');
    }
  }
  deletebkm() {
    const bookmarkEvent: ITrackBookmarkEvent = {
      bookmarkName: this.bookmarkName,
      event: TrackBookmarkEvent.TYPE_BKM_DELETED
    }
    //alert( this.bookmarkeid+"...////" );
    this.cs.postData({ sourceid: 'delete_listing', info: { query: 'bookmarks', pdata: { id: 'id', value: this.bookmarkeid } } })
      .pipe(
        concatMap(res => {
          return this.trackingService.trackBookmarkEvent({
            uid: this.cs.user_session.id,
            type: TrackingTypes.TYPE_BOOKMARKS,
            data: JSON.stringify(bookmarkEvent),
          }).pipe(map(_ => res))
        })
      )
      .subscribe((data: any) => {
        if (data.status == 1) {
          //this.ls.listing_data.splice(j,1);
          this.cs.isbookmarked = 0;
          this.cs.openGrowl('', 'Status', 'Deleted successfully');
          this.mdls.modalRef.hide();
        } else {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
        }
      });
  }
  public openmdl(id) {
    this.mdls.openmdl(id);
    this.cs.popdragabale();
  }
  public openlinkpage(id) {
    //var dt={'content_type':1,'page_id':id,}
    //  this.opnerelated_con(dt,'');
    this.cs.active_newlinkemitChange(id);
  }
  public opnerelated_con(dt, name) {
    this.opened_relcon_name = name;
    this.prepared_relatedcontent['page_id'] = dt.page_id;
    if (dt['content_type'] == 1 || dt['content_type'] == 2) {
      var tbl_name = "pages";
      var tempid = dt['page_id'];
      var columns = ['title', 'content', 'file_upload'];
    } else if (dt['content_type'] == 3) {
      var tbl_name = "wordsexplainer";
      var tempid = dt['page_id'];
      var columns = ['content_title', 'content', 'content_type'];
    }
    this.cs.postData({
      sourceid: 'listingdetails',
      info: { query: tbl_name, pdata: { id: 'id', value: tempid }, selcolumns: columns }
    }).subscribe((data: any) => {
      //console.log(JSON.stringify(data));
      //  console.log(">>>><<<<</////////////<<<<<<<<<<<");
      if (data.status == 1) {
        if (dt['content_type'] == 1) {
          this.prepared_relatedcontent['title'] = data['response']['title'];
          this.prepared_relatedcontent['content_type'] = dt['content_type'];
          this.prepared_relatedcontent['data'] = data['response']['content']
            // .replace(new RegExp('{imgsevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/images/"))
            // .replace(new RegExp('{videosevurl}', 'g'), this.cs.apiUrl + "staticassets/contentdata/videos/")
            .replace(new RegExp('{sevurl}', 'g'), this.cs.apiUrl);
          this.cdr.detectChanges();
          this.triggerall_pagactions();
          this.showoverlay = true;
        }
        else if (dt['content_type'] == 3) {
          this.prepared_relatedcontent['title'] = data['response']['content_title'];
          this.prepared_relatedcontent['data'] = data['response']['content'];
          this.prepared_relatedcontent['type'] = data['response']['content_type'];
          this.prepared_relatedcontent['content_type'] = dt['content_type'];
          this.cdr.detectChanges();
          this.triggerall_pagactions();
          this.showoverlay = true;
        }
        else if (dt['content_type'] == 2) {
          this.prepared_relatedcontent['title'] = data['response']['title'];
          this.prepared_relatedcontent['data'] = this.cs.apiUrl + "static/manuals/" + data['response']['file_upload'];
          this.prepared_relatedcontent['content_type'] = dt['content_type'];
          this.prepared_relatedcontent['innerlink'] = dt['innerlink'];
          this.cdr.detectChanges();
          this.triggerall_pagactions();
          this.showoverlay = true;
        }
      }
    });
    //  this.updatepagecon(this.pagecontent[id]);
  }
  closeoverlay() {
    this.showoverlay = false;
    this.prepared_relatedcontent = { title: '', data: '', type: 0, content_type: 0, page_id: 0 };
  }
  ngOnDestroy() {
    this.cs.annots_count = 0;
    this.cs.isbookmarked = 0;
    this.cs.selpage_id = 0;
    this.cs.emitPageactions('0');
    this.hotspotEventsSub$?.unsubscribe();
    this.cs.selmodule_name = "";
    this.tableWidthAdjustSub$?.unsubscribe();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      //alert(JSON.stringify(params));
      if (params['pageid']) {
        this.cs.selpage_id = params['pageid'];
        // alert("fdkglf");
        this.cs.annots_count = 0;
        this.getpagecontent(this.cs.selpage_id);
        // Hide any image popup when transitioning to new route
        $('.magnify-modal').hide()
      }
    })

    ShareThis({
      selector: '#page_content',
      popoverClass: `share-this-popover ${this.cs.default_theme}`,
      sharers: [
        {
          name: "add_annnot",
          render: () => 'Add Annotation',
          active: () => this.cs.user_session.user_type != 0,
          action: () => {
            setTimeout(() => {
              this.addAnnotation()
            }, 300);
          },
        },
        {
          name: "add_hotspot",
          render: () => 'Add Hotspot',
          active: () => this.cs.user_session.user_type <= 1,
          action: () => this.addHotspot()
        },
        {
          name: "add_hyperlink",
          render: () => 'Add Hyperlink',
          active: () => this.cs.user_session.user_type == 0,
          action: () => this.addHyperlink()
        }
      ],
    }).init();

    this.wmEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'action_done') {
        const inputData = resp.data
        this.postAddWordExplainer(inputData)
      }
    })

    this.wmpEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'type_edit') {
        this.editWE(resp.data)
      } else if (type == 'type_del') {
        // need to update `explainerdata.id` as we can't pass data to openmdl func
        this.explainerdata.id = resp.data
        // this.openmdl(this.explainerdelcnfm);
        this.wmdEmitter.next({
          type: 'del_cnfm',
          data: {
            title: 'Delete Explainer',
            msg: 'This will delete the Explainer permanently. Would you like to proceed?'
          }
        })
      }
    })

    this.wmdEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'del_okay') {
        this.delWE(this.explainerdata.id)
      }
    });

    this.hotspotEventsSub$ = this.hS.triggerHyp$.subscribe((resp: IHyperlinkTransmitData) => {
      const { action, data, status } = resp;
      if ([HyperlinkActionTypes.TYPE_POST_ADD, HyperlinkActionTypes.TYPE_POST_EDIT].includes(action)) {
        this.postAddHyperlink(data);
      } else if (action == HyperlinkActionTypes.TYPE_EDIT) {
        // this.hypEmitter.next({ type, data })
        const ref = this.modalS.show(HyperlinkAddUpdComponent, {
          class: this.cs.default_theme,
          initialState: {
            editMode: true,
            myData: {
              id: data.node_id.toString(),
              content: '',
              from_page: -1,
              to_page: -1
            }
          }
        });
        const content = ref.content as HyperlinkAddUpdComponent;
        content.modalRef = ref;
        this.cs.popdragabale();
      } else if (action == HyperlinkActionTypes.TYPE_DELETE) {
        // need to save id to process delete
        const ref = this.modalS.show(HyperlinkDeleteComponent, {
          class: this.cs.default_theme,
          initialState: {
            hypId: data.node_id,
            pgdesc: this.pgdesc.nativeElement?.innerHTML
          }
        });
        const content = ref.content as HyperlinkDeleteComponent;
        content.modalRef = ref;
        this.cs.popdragabale();
      } else if (action == HyperlinkActionTypes.TYPE_POST_DEL) {
        this.postDelHyperlink({
          status,
          node_id: data.node_id
        });
      }
    })
  }

}
