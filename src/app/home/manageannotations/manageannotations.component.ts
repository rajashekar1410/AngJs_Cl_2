import { Component, ViewChild, OnInit, OnDestroy, TemplateRef, ChangeDetectorRef, ApplicationRef, AfterViewInit } from '@angular/core';
import { ListingService } from 'src/app/core/services/listing/listing.service';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { ModalDirective, BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
//====PRINT HEADERS============================
import { concatMap, map } from 'rxjs/operators';
import { ITrackAnnotationEvent, TrackAnnotationEvent } from 'src/app/shared/modules/user-tracking/models/track-annotation';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { Subject, Subscription } from 'rxjs';
import { IIETMTableContentFilter } from 'src/app/shared/modules/ietm-table/models/content-filter';
import { IETMTableEventSubTypes, IETMTableEventTypes, IIETMTableEvent } from 'src/app/shared/modules/ietm-table/models/emit-event-type';
import { IetmTableService } from 'src/app/shared/modules/ietm-table/services/ietm-table/ietm-table.service';

declare var $: JQueryStatic;

@Component({
  selector: 'app-manageannotations',
  templateUrl: './manageannotations.component.html',
  styleUrls: ['./manageannotations.component.css']
})
export class ManageannotationsComponent implements OnInit, AfterViewInit, OnDestroy {

  public modalRef: BsModalRef | null;
  public selected_anot_position = 0;

  public print_date = new Date();

  ajaxSub$: Subscription = null;
  printDataSub$: Subscription = null;

  @ViewChild('comments', { read: TemplateRef }) comments: TemplateRef<any>;
  @ViewChild('editmember', { read: TemplateRef }) editmember: TemplateRef<any>;
  @ViewChild('deletannots', { read: TemplateRef }) deletannots: TemplateRef<any>;


  // tracks if we update page header on init
  updatePageHeader = true;

  @ViewChild('logadd') public addlog: ModalDirective;
  @ViewChild('annotsdel', { static: true }) public annotsdel: ModalDirective;
  selected_annotation = {};

  dtOptions: DataTables.Settings = {};
  dtTrigger = new Subject();

  dtfilters = { 'annotation_type': 0, 'user_id': this.cs.user_session['id'], 'user_type': this.cs.user_session.user_type };
  // content filter stuff
  dtContentFilterData = new Array<IIETMTableContentFilter>();
  dtContentFilterFunction = (v: number) => { this.dtfilters['annotation_type'] = v; };

  showintro = 1;
  showpassword = 0;
  formvalidation: string;
  lookuptypedata: any;
  showListing = true;
  form_title = 'Edit Annotation';
  form_btntitle = 'Submit';
  userlist = 0;
  retype_pwd = "";
  present_password = "";
  anoate_typefilter = 10;
  annoatetype = 10;
  selectedanotival = 0;
  tdata = { id: '', title: '', description: '', annotation_type: '2', created_by: this.cs.user_session['id'] };
  tddelete = 0;
  public tbl_start = 0;
  public ordercols_table = { orderable: false, targets: [0, 5] };
  public defaultsort_column = [[2, "desc"]];
  public annotation_types = { 0: 'All', 2: 'Feedback to Administrator', 1: 'Notes' };
  public annotation_comments = [];
  public comments_pos = 0;
  public show_comments = 0;
  public comments_btntitle = "Submit";
  public comments_formvalidation = "";
  public selected_comment_annotid = 0;
  public comments_tdata = { id: '', annotation_id: 0, comments: '', created_by: this.cs.user_session['id'] };

  tableEvents = IETMTableEventTypes;

  constructor(
    public appref: ApplicationRef,
    public cdr: ChangeDetectorRef,
    public modalService: BsModalService,
    public bsModalRef: BsModalRef,
    private http: HttpClient,
    public router: Router,
    public ls: ListingService,
    public cs: CommonService,
    public mdls: IetmModalService,
    private trackingService: UserTrackingService,
    private ietmTableS: IetmTableService
  ) {
  }

  ngOnInit(): void {
    this.cs.emitChange('1');
    this.ls.selectedAll = 0;
    this.defaultsort_column = [[6, "desc"]];
    this.dtfilters = { 'annotation_type': 0, 'user_id': this.cs.user_session['id'], 'user_type': this.cs.user_session.user_type };
    if (this.cs.view_annotationid != 0) {
      this.dtfilters['page_id'] = this.cs.view_annotationid;
      this.dtfilters['annotation_type'] = this.cs.view_annot_type;
    }

    if (this.updatePageHeader) this.cs.page_header = "Manage Annotations";
    // content filters
    this.dtContentFilterData.push(
      {
        cmd: 'all',
        title: 'All',
        data: 0
      },
      {
        cmd: 'notes',
        title: 'Notes',
        data: 1
      },
      {
        cmd: 'feedback_admin',
        title: 'Feedback to Administrator',
        data: 2
      }
    );
  }

  ngAfterViewInit() {
    // init table
    this.getdtl();
    /*setTimeout(() => {
      this.dtTrigger.next();
    }, 400);*/
  }

  onTableEvent(event: IIETMTableEvent) {
    switch (event.type) {
      case IETMTableEventTypes.TYPE_PRINT:
        switch (event.data) {
          case IETMTableEventSubTypes.TYPE_TASK_SUCCESS: {
            // track print event
            this.reportPrintTrackingEvent();
            break;
          }
        }
        break;
      case IETMTableEventTypes.TYPE_ITEM_DELETE:
        switch (event.data) {
          case IETMTableEventSubTypes.TYPE_TASK_INIT:
            this.opendelconf(1, this.deletannots);
            break;
          case IETMTableEventSubTypes.TYPE_TASK_SUCCESS:
            this.cs.openGrowl('', 'Status', 'Annotations deleted successfully');

            break;
          case IETMTableEventSubTypes.TYPE_TASK_FAILED:
            this.cs.openGrowl('', 'Status', 'Failed to delete annotations');
            break;
        }
        break;
    }
  }

  _triggerAnnotationDelete() {
    this.ietmTableS.eventEmitter.next({
      type: IETMTableEventTypes.TYPE_ITEM_DELETE
    });
    this.closeconfirm();
  }

  reportPrintTrackingEvent() {
    const annotationEvent: ITrackAnnotationEvent = {
      annotationName: '',
      event: TrackAnnotationEvent.TYPE_ANT_PRINTED,
      privacy: -1
    }
    this.trackingService.trackAnnotationEvent({
      uid: this.cs.user_session.id,
      type: TrackingTypes.TYPE_ANNOTATIONS,
      data: JSON.stringify(annotationEvent),
    }).toPromise();
  }

  getdtllistings(type: number) {
    this.dtfilters['annotation_type'] = type;
    setTimeout(() => {
      //console.log(JSON.stringify(this.dtfilters));
      // $('#tbllistid').DataTable().ajax.reload();
      this.dtTrigger.next()
    }, 100);
  }

  closeconfirm() {
    this.modalRef?.hide();
  }

  closecomment() {
    this.mdls.closemodal();
  }

  deletecomment(id) {
    //  alert(id);
    this.cs.postData({ sourceid: 'delete_listing', info: { query: 'annotation_comments', pdata: { id: 'id', value: id } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          //this.ls.listing_data.splice(j,1);
          this.mdls.modalRef.hide();
          this.annotation_comments.splice(this.comments_pos, 1);
          this.ls.listing_data[this.selected_anot_position]['comments_count'] = Number(this.ls.listing_data[this.selected_anot_position]['comments_count']) - 1;
          this.appref.tick();
          this.cs.openGrowl('', 'Status', 'Deleted successfully');
          this.dtTrigger.next();
        } else {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
        }
      });
  }

  deleteant(id) {
    if (id == 0) {
      this.ls.multiplerecdeletion('id', 'annotations');
    } else {
      const ant = this.ls.listing_data.find(el => el.id == id);
      const annotationEvent: ITrackAnnotationEvent = {
        annotationName: ant.description,
        event: TrackAnnotationEvent.TYPE_ANT_DELETED,
        privacy: ant.annotation_type
      };
      this.cs.postData({ sourceid: 'delete_listing', info: { query: 'annotations', pdata: { id: 'id', value: id } } })
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
            //this.ls.listing_data.splice(j,1);
            $('#tbllistid').DataTable().ajax.reload();
            this.closeconfirm();
            this.cs.openGrowl('', 'Status', 'Deleted successfully');
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        });
    }
  }

  opendelconf(id, tag: TemplateRef<any>) {
    //alert(id+"///////////////////");
    this.tddelete = id;
    this.modalRef = this.modalService.show(tag, {
      // backdrop: false,
      ignoreBackdropClick: true,
      class: this.cs.default_theme
    });
    this.cdr.detectChanges();
    this.mdls.popdragabale();
  }

  open_commentsdelconf(id, deletannots, j) {
    this.tddelete = id;
    this.comments_pos = j;
    this.mdls.openmdl(deletannots);
  }

  edit_comment(id, name, j) {
    // alert(id+">>>????"+this.annotation_comments[j]['id'])
    this.comments_tdata['comments'] = this.annotation_comments[j]['comments'];
    this.comments_tdata['annotation_id'] = this.annotation_comments[j]['annotation_id'];
    this.comments_tdata['id'] = this.annotation_comments[j]['id'];
    this.comments_pos = j;
    this.show_comments = 1;
    this.comments_btntitle = "Update"
  }

  add_comment() {
    this.comments_tdata = { id: '', annotation_id: 0, comments: '', created_by: this.cs.user_session['id'] };;
    this.comments_btntitle = "Add";
    this.show_comments = 1;
  }

  close_comments(id) {
    this.mdls.closemodal(id);
  }

  managecomments(commentsForm) {
    if (commentsForm.valid) {
      this.comments_tdata['annotation_id'] = this.selected_comment_annotid;
      this.comments_tdata['creation_date'] = moment().format("YYYY-MM-DD HH:mm:ss");
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.comments_tdata, query: 'annotation_comments', pdata: { id: 'id', value: this.comments_tdata['id'] } } })
        .subscribe((data: any) => {
          if (data.status == 1) {
            this.comments_tdata['user_name'] = this.cs.user_session.user_name;
            if (this.comments_tdata['id'] != '') {
              this.annotation_comments[this.comments_pos]['comments'] = this.comments_tdata['comments'];
              this.comments_tdata = { id: '', annotation_id: 0, comments: '', created_by: this.cs.user_session['id'] }
              this.cs.openGrowl('', 'Status', 'Updated successfully');
            } else {
              //alert(data.response);
              this.ls.listing_data[this.selected_anot_position]['comments_count'] = Number(this.ls.listing_data[this.selected_anot_position]['comments_count']) + 1;
              this.appref.tick();
              this.comments_tdata['id'] = data.response;
              this.annotation_comments.unshift(this.comments_tdata);
              this.cs.openGrowl('', 'Status', 'Added successfully');
              // reload main table
              this.dtTrigger.next();
            }
            this.show_comments = 0;
            this.comments_tdata = { id: '', annotation_id: 0, comments: '', created_by: this.cs.user_session['id'] };;
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        });
    } else {
      this.cs.openGrowl('', 'Status', 'Fill out all Mandatory Fields');
    }
  }

  manageannotations(annotForm) {
    if (annotForm.valid) {
      const ant = this.ls.listing_data.find(el => el.id == this.tdata.id);
      const annotationEvent: ITrackAnnotationEvent = {
        annotationName: `From '${ant.description}' to '${this.tdata.description}'`,
        privacy: parseInt(this.tdata.annotation_type),
        event: TrackAnnotationEvent.TYPE_ANT_EDITED
      };
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.tdata, query: 'annotations', pdata: { id: 'id', value: this.tdata['id'] } } })
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
            /*this.ls.listing_data[this.selectedanotival]['title'] = this.tdata['title'];
            this.ls.listing_data[this.selectedanotival]['description'] = this.tdata['description'];
            this.ls.listing_data[this.selectedanotival]['privacy'] = this.tdata['privacy'];
            this.ls.listing_data[this.selectedanotival]['annotation_type'] = this.tdata['annotation_type'];*/
            if (this.tdata['id'] != '') {
              this.cs.openGrowl('', 'Status', 'Updated successfully');
            } else {
              this.cs.openGrowl('', 'Status', 'Added successfully');
            }
            this.tdata = { id: '', title: '', description: '', annotation_type: '2', created_by: this.cs.user_session['id'] };
            this.mdls.modalRef.hide();
            setTimeout(() => {
              // alert("ldkflr");
              $('#tbllistid').DataTable().ajax.reload();
            }, 100);
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        });
    } else {
      this.cs.openGrowl('', 'Status', 'Fill out all Mandatory Fields');
    }
  }

  addanot(mdlid) {
    this.form_title = 'Add Annotation';
    this.form_btntitle = 'SAVE';
    this.tdata = { id: '', title: '', description: '', annotation_type: '2', created_by: this.cs.user_session['id'] }
    this.showListing = false;
    this.mdls.openmdl(mdlid);
    this.mdls.popdragabale();
  }

  editform(mdlid, pvalue, ival) {
    this.form_title = 'Edit Annotation';
    this.form_btntitle = 'SAVE';
    this.tdata = { id: '', title: '', description: '', annotation_type: '2', created_by: this.cs.user_session['id'] };
    this.showListing = false;
    this.selectedanotival = ival;
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'annotations', pdata: { id: 'id', value: pvalue }, selcolumns: ['id', 'title', 'description', 'annotation_type'] }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        this.tdata = data.response;

        this.tdata.annotation_type = '' + this.tdata.annotation_type;
        // alert(this.tdata);
        this.mdls.openmdl(mdlid);
        this.mdls.popdragabale();
      } else {
        this.cs.openGrowl('', 'Status', 'Some error Occured');
      }
    })
  }

  getdtl() {
    const that = this;
    this.dtOptions = {
      "language": { search: "Find:", emptyTable: 'No records found', searchPlaceholder: 'By: Title , Description, User Name' },
      pageLength: 10, serverSide: true, processing: false, searching: true, destroy: true,
      lengthChange: true, "order": this.defaultsort_column, scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "annotationsview";
        dataTablesParameters['dtfilters'] = this.dtfilters;
        //console.log(JSON.stringify( this.dtfilters));
        dataTablesParameters['searchquery'] = " and (title like '%" + dataTablesParameters['search']['value'] + "%' or description like '%" + dataTablesParameters['search']['value'] + "%' or user_name like '%" + dataTablesParameters['search']['value'] + "%'  )"
        this.tbl_start = dataTablesParameters['start'];
        that.ajaxSub$ = that.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //   console.log(JSON.stringify(resp));
            that.ls.listing_data = resp.data;
            setTimeout(() => {
              $('#tbllistid').DataTable().columns.adjust();
            }, 300);
            if (this.dtfilters['annotation_type'] == 1) {
              this.cs.AnnotationsChange({ note_anots_count: resp.recordsTotal, feedback_anots_count: this.cs.feedback_anots_count })
            }
            if (this.dtfilters['annotation_type'] == 2) {
              this.cs.AnnotationsChange({ note_anots_count: this.cs.note_anots_count, feedback_anots_count: resp.recordsTotal })
            }
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          }, error => {
            console.log("Rrror", error);
          });
      },
      columns: [
        // dummy index column fixes sorting bug in server
        { data: 'index', visible: false },
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          width: '7%',
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1,
          createdCell: (cell, _, row) => {
            if (this.cs.user_session.user_type == 1 || row['created_by'] == this.cs.user_session.id) {
              $(cell).addClass('select-checkbox');
            } else {
              $(cell).removeClass('select-checkbox');
            }
          }
        },
        {
          data: 'title',
          title: 'Annotated Text',
          render: (val) => `<span class="txtlink" style="text-decoration: none">${val}</span>`,
          createdCell: (cell, _, row) => {
            // cell click listener
            $(cell).on('click', function () {
              // highlight word on nav
              setTimeout(() => {
                that.cs.removeMarkTags();
                $(`span[data-node-id="${row['id']}"]`).wrap('<mark />');
                // hide modalRef on item click inside IETM Core
                if (!that.updatePageHeader) that.modalRef?.hide();
              }, 1000);
              const pageId = row['page_id'];
              that.cs.navigateToPage(pageId);
            });
          }
        },
        { data: 'description', title: 'Description' },
        {
          data: 'annotation_type', title: 'Annotation Type',
          width: '20%',
          render: (val) => {

            return that.cs.annotation_type[val]
          }
        },
        { data: 'user_name', title: 'User' },
        {
          data: 'creation_date', title: 'Date & Time',
          render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a'),
          width: '15%',
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '7%',
          createdCell: (cell, _, row) => {
            // clear old contents
            $(cell).html('');

            // column content
            const btn = $(`
            <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
              <i class="lni lni-cog">
            </button>
            `)
              .appendTo(cell as HTMLElement);

            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: `Comments (${row['comments_count']})`, cmd: "comments", uiIcon: "ui-icon-comment" },
                  { title: "Edit", cmd: "edit", uiIcon: "ui-icon-pencil", disabled: that.cs.user_session.id != row['created_by'] },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    const itemIndex = $("#tbllistid").DataTable().cell(cellItem).index().row;
                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      that.editform(that.editmember, row['id'], itemIndex);
                    } else if (ui.cmd == 'comments') {
                      that.openComments(row['id'], that.comments, row, itemIndex)
                    }
                  } catch (err) { console.error(err); }
                }
              });

            // quick hack for left-click menu
            $(btn).on('click', function () {
              $(btn).trigger('contextmenu');
            });

            return btn.html();
          }
        },
        { data: 'created_by', visible: false },
        { data: 'employee_id', visible: false },
        { data: 'user_type', visible: false },
        { data: 'pagetitle', visible: false },
        { data: 'page_category', visible: false },
        { data: 'id', visible: false },
        { data: 'page_id', visible: false },
        { data: 'comments_count', visible: false }
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' },
        // enables checkbox for 0th <td> element
        {
          orderable: false,
          targets: 0
        }
      ],
      // setup checkbox
      select: {
        style: 'multi',
        selector: 'td.select-checkbox:first-child',
        info: false
      },
      // columnDefs: [
      //   { targets: this.selcols_table, visible: true },
      //   { targets: '_all', visible: false },
      //   this.ordercols_table
      // ]
    };
    setTimeout(() => {
      that.dtTrigger.next();
    }, 500);
  }

  openComments(id, tag: TemplateRef<any>, dta, j) {
    this.selected_anot_position = j;
    this.selected_annotation = dta;
    this.comments_tdata = { id: '', annotation_id: 0, comments: '', created_by: this.cs.user_session['id'] };;
    this.comments_btntitle = "Add";
    this.show_comments = 0
    this.selected_comment_annotid = id;
    this.annotation_comments = [];
    this.cs.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: { annotation_id: id }, query: 'annotation_comments_view', selected_colnames: ['id', 'annotation_id', 'comments', 'created_by', 'user_name', 'title', 'description', 'creation_date', 'annot_user_name', 'annot_created_date'], search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'annot_created_date', ordertype: 'desc' } } })
      .subscribe(data => {
        if (data['status'] == 2) {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
        } else {
          if (data['status'] == 1) {
            this.annotation_comments = data['response'];
          }
          this.modalRef = this.modalService.show(tag, {
            class: this.cs.default_theme,
            ignoreBackdropClick: true
          });
          this.cdr.detectChanges();
          this.mdls.popdragabale();
        }
      }, error => alert(error));
  }

  openpage(cat, id) {
    // alert(cat+">>>???"+id);
    this.cs.selpage_id = id;
    // Fetch module info from page
    this.cs.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: { id: id }, query: 'pages', selected_colnames: ['id', 'page_module'], search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'id', ordertype: 'desc' } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          console.log(data)
          if (data.response.length > 0) {
            const { page_module } = data.response[0];
            this.router.navigate(['/home/pages/pagecmp/' + page_module + '/' + cat]);
          } else {
            this.cs.openGrowl('', 'Status', 'Annotation unavailable.')
          }
        } else {
          this.cs.openGrowl('', 'Status', 'Annotation unavailable.')
        }
      },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.')
        });

  }

  ngOnDestroy(): void {
    this.cs.view_annotationid = 0;
    this.cs.view_annot_type = 0;
    this.printDataSub$?.unsubscribe();
    this.ajaxSub$?.unsubscribe();
    this.dtTrigger?.unsubscribe();
  }
}
