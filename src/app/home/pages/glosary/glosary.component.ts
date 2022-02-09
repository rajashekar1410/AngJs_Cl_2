import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../../../core/services/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { IetmModalService } from '../../../core/services/ietm-modal/ietm-modal.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { NgForm } from '@angular/forms';
import { DataTableDirective } from 'angular-datatables';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ListingService } from 'src/app/core/services/listing/listing.service';
import { concatMap, map } from 'rxjs/operators';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { ITrackGlossaryEvent, TrackGlossaryEvent } from 'src/app/shared/modules/user-tracking/models/track-glossary';
import { PrintDataService } from 'src/app/shared/modules/print-data/services/print-data.service';
import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { Subject, Subscription } from 'rxjs';
import { IETMTableEventSubTypes, IETMTableEventTypes, IIETMTableEvent } from 'src/app/shared/modules/ietm-table/models/emit-event-type';
import { IetmTableService } from 'src/app/shared/modules/ietm-table/services/ietm-table/ietm-table.service';

declare var $: JQueryStatic;
@Component({
  selector: 'app-glosary',
  templateUrl: './glosary.html',
})
export class GlosaryComponent implements OnInit, OnDestroy {

  @ViewChild('glosaryadd') public addglosary: ModalDirective;
  @ViewChild('glosarydel') public delglossary: ModalDirective;

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dtTrigger = new Subject();

  csvFile: File = null;
  @ViewChild('fileUploadModal') fileUploadModal: ElementRef;
  isUploadingFile = false;
  csvSampleFilePath = `${this.cs.staticmageurl}/templates/glossary-upload.csv`;

  public activeglosary = 0;
  public tbl_start = 0;
  public dtfilters = {};
  public glosary_form_title = 'Add glossary';
  public glosary_form_btntitle = 'SUBMIT';
  public glosary_validation = "";
  public pdfSrc: string = '';
  public showglosaryform = false;
  public alpha_filter = '';
  public glossary_list = [];
  public glosary_type = 0;
  public selcols_table = [0, 1, 2, 3];
  public changeglosaryform = { id: '', golssary_name: '', description: '', glossary_type: 0 }
  public ordercols_table = { orderable: false, targets: [0, 4] };
  public alpha_array = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  printDataSub$: Subscription = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public mdls: IetmModalService,
    private http: HttpClient,
    public etmdl: IetmModalService,
    public cs: CommonService,
    public ls: ListingService,
    private trackingService: UserTrackingService,
    private printDataService: PrintDataService,
    private tableS: IetmTableService
  ) { }

  ngOnInit(): void {
    // update UI
    this.cs.emitChange('1');
    this.cs.page_header = "Glossary";

    // if (this.cs.user_session.user_type == 0) {
    //   this.selcols_table = [0, 1, 2, 3, 4];
    //   this.ordercols_table = { orderable: false, targets: [0, 4] };
    // } else {
    //   this.selcols_table = [0, 1, 2];
    //   this.ordercols_table = { orderable: false, targets: [0] };
    // }
    this.cs.triggerLogsEmitted$.subscribe(
      text => {
        this.glosary_type = text;
        this.dtfilters['glossary_type'] = text;
        //  alert(text);
        this.ls.selectedAll = 0;
        this.ls.enableseldelete = 0;
        this.alpha_filter = '';
        this.ls.listing_data = [];
        setTimeout(() => {
          $('#tbllistid').DataTable().ajax.reload(null, false);
        }, 300);
      });
    this.route.params.subscribe(params => {
      if (params['pageid']) {
        // alert(params['pageid']);
        this.dtfilters['glossary_type'] = params['pageid'];
        // Fix bug with `this.glosary_type` not updated to TOC's active node's `id`
        // even though the data is sent via route param
        this.glosary_type = params['pageid'];
        const that = this;
        this.dtOptions = {
          "language": { search: "Find:", emptyTable: 'No records found' },
          pageLength: 10, serverSide: true, processing: false, searching: true,
          lengthChange: true, "order": [[1, "asc"]], scrollY: "calc(100vh - 360px)", "scrollX": true, scrollCollapse: true, destroy: true,
          ajax: (dataTablesParameters: any, callback) => {
            dataTablesParameters['query_tbl'] = "glossary";
            dataTablesParameters['dtfilters'] = this.dtfilters;
            dataTablesParameters['searchquery'] = " and (  golssary_name like '%" + dataTablesParameters['search']['value'] + "%' or  description like '%" + dataTablesParameters['search']['value'] + "%' )"
            if (this.alpha_filter != '') {
              dataTablesParameters['alpha_filter'] = " and golssary_name like '" + this.alpha_filter.toLowerCase() + "%'";
            }
            //console.log("================"+dataTablesParameters['searchquery']+"==================");
            this.tbl_start = dataTablesParameters['start'];
            that.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
              this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
                // console.glosary(JSON.stringify(resp));
                if (resp['status'] == 1) {
                  // this.userscount=resp.recordsTotal+1;
                  callback({
                    recordsTotal: resp.recordsTotal,
                    recordsFiltered: resp.recordsFiltered,
                    data: resp.data
                  });
                } else {
                  alert("Error occured");
                }
              }, error => {
                console.log("Rrror", error);
              });
          },
          columns: [
            { data: '1', title: 'Sr. No', width: '7%', render: (_, __, ___, meta) => this.tbl_start + meta.row + 1 },
            { data: 'id', title: 'ID', visible: that.cs.user_session.user_type == 0 },
            { data: 'golssary_name', title: that.glosary_type == 1 ? 'Abbreviation' : 'Term' },
            { data: 'description', title: that.glosary_type == 1 ? 'Description' : 'Definition' },
            {
              data: '1',
              title: 'Actions',
              orderable: false,
              visible: that.cs.user_session.user_type == 0,
              createdCell: (cell) => {
                if (that.cs.user_session.user_type != 0) return;
                // clear old contents
                $(cell).html('');

                // column content
                const btn = $(`
                <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
                  <i class="lni lni-cog">
                </button>
                `)
                  .appendTo(cell as HTMLElement);

                const row = $("#tbllistid").DataTable().row(cell).data();
                // context menu init
                ($ as any)(cell)
                  .contextmenu({
                    delegate: "button",
                    menu: [

                      { title: "Edit", cmd: "edit", uiIcon: "ui-icon-pencil" },
                    ],
                    preventContextMenuForPopup: true,
                    select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                      try {
                        if (ui.cmd == 'edit') {
                          that.editglosary(row['id']);
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
          ],
          columnDefs: [
            { targets: '_all', defaultContent: '' },
            // enables checkbox for 0th <td> element IF SUPERADMIN
            {
              orderable: false,
              className: that.cs.user_session.user_type == 0 ? 'select-checkbox' : '',
              targets: 0
            }
          ],
          // setup checkbox IF SUPERADMIN
          select: that.cs.user_session.user_type == 0 ? {
            style: 'multi',
            selector: 'td:first-child',
            info: false
          } : false,
        };

      }
    })
  }

  ngAfterViewInit() {
    // 600ms needed for select checkbox listener to work
    setTimeout(() => {
      this.reloadTable();
    }, 600);
  }

  openFileUploadModal() {
    // hide parent modal
    this.addglosary.hide();
    // show file upload modal
    this.mdls.openmdl(this.fileUploadModal);
    // Show file upload dialog on load
    setTimeout.call(this, () => {
      $('input[type="file"]', this.fileUploadModal.nativeElement).trigger('click');
    }, 500);
  }

  onFileChanged(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files.length == 1) {
      this.csvFile = files[0];
    } else {
      this.cs.openGrowl('', 'Error', 'Invalid file selection, expected 1 CSV file');
    }
  }

  processFileSubmit() {
    const formData = new FormData();
    formData.append('csv_file', this.csvFile, this.csvFile.name);

    this.isUploadingFile = true;

    this.http.post<any>(this.cs.apiUrl + 'glossary_upload', formData)
      .subscribe(
        resp => {
          const { status } = resp;
          if (status == 1) {
            this.cs.openGrowl('', 'Status', 'Glossary has been updated successfully.');
            // reload table
            this.dtTrigger.next();
            // reset UI
            this.mdls.modalRef?.hide();
            this.isUploadingFile = false;
          } else {
            this.cs.openGrowl('', 'Status', 'File upload failed.');
            this.isUploadingFile = false;
          }
        },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error occurred.');
          this.isUploadingFile = false;
        }
      );
  }

  onTableEvent(event: IIETMTableEvent) {
    // console.log(event);
    switch (event.type) {
      case IETMTableEventTypes.TYPE_ITEM_ADD:
        this.glosaryaddform();
        break;

      case IETMTableEventTypes.TYPE_ITEM_DELETE:
        switch (event.data) {
          case IETMTableEventSubTypes.TYPE_TASK_INIT:
            this.delglossary.show();
            break;
          case IETMTableEventSubTypes.TYPE_TASK_SUCCESS:
            this.cs.openGrowl('', 'Status', 'Glossary item deleted sucessfully.');
            break;
          case IETMTableEventSubTypes.TYPE_TASK_FAILED:
            this.cs.openGrowl('', 'Status', 'Failed to delete glossary item.');
            break;
        }
        break;

      case IETMTableEventTypes.TYPE_PRINT:
        switch (event.data) {
          case IETMTableEventSubTypes.TYPE_TASK_INIT:
            this.printData();
            break;
        }
    }
  }

  onDeleteRequested() {
    this.delglossary.hide();
    this.tableS.eventEmitter.next({
      type: IETMTableEventTypes.TYPE_ITEM_DELETE
    });
  }


  printData() {
    // hide last column + rows of table
    const thSelector = '.table thead th:last-child';
    const tbSelector = '.table tbody td:last-child';
    // Note: don't hide last column on admin account
    if (this.cs.user_session.user_type != 1) {
      $(thSelector).hide();
      $(tbSelector).hide();
    }
    // TODO: improve selection accuracy
    const checkboxSelector = 'input:checkbox';
    $(checkboxSelector).hide();
    // print request
    const headers = $('.table thead').html();
    const tbody = $('.table tbody').html();
    // process request
    this.printDataSub$ = this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: PrintDataTypes.TYPE_TABLE
    })
      .pipe(
        concatMap(res => {
          const glossaryEvent: ITrackGlossaryEvent = {
            event: TrackGlossaryEvent.TYPE_GL_PRINTED
          }
          return this.trackingService.trackAnnotationEvent({
            uid: this.cs.user_session.id,
            type: TrackingTypes.TYPE_GLOSSARY,
            data: JSON.stringify(glossaryEvent),
          }).pipe(map(_ => res))
        })
      )
      .subscribe(
        _ => {
          if (this.cs.user_session.user_type != 1) {
            // reset table UI
            $(thSelector).show();
            $(tbSelector).show();
          }
          $(checkboxSelector).show();
        },
        err => {
          console.error(err);
          if (this.cs.user_session.user_type != 1) {
            // reset table UI
            $(thSelector).show();
            $(tbSelector).show();
          }
          $(checkboxSelector).show();
        }
      )
  }

  public updateglosary(id) {
    //alert(id);
    this.dtfilters['glossary_type'] = id;
    setTimeout(() => {
      $('#tbllistid').DataTable().ajax.reload(null, false);
    }, 300);

  }
  public searchalpha(id: string) {
    // alert(id);
    this.alpha_filter = id;
    setTimeout(() => {
      $('#tbllistid').DataTable().ajax.reload(null, false);
    }, 300);
    // $('#tbllistid').DataTable().ajax.reload();
  }

  glosaryaddform() {
    this.glosary_form_title = 'Add Glossary';
    this.glosary_form_btntitle = 'SAVE';
    this.changeglosaryform = { id: '', golssary_name: '', description: '', glossary_type: 0 };
    this.showglosaryform = true;
    this.addglosary.show();
    this.mdls.popdragabale();
  }
  editglosary(id) {
    //alert(id);
    this.glosary_form_title = 'Edit glossary';
    this.glosary_form_btntitle = 'UPDATE';
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'glossary', pdata: { id: 'id', value: id }, selcolumns: Object.keys(this.changeglosaryform) }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        this.changeglosaryform = data.response;
        this.showglosaryform = true;
        this.addglosary.show();
        this.mdls.popdragabale();
      } else {
        this.cs.openGrowl('', 'Status', 'Some error Occured');
      }
    })
  }
  manageglosaryform(newglosary: NgForm) {
    this.glosary_validation = "";

    if (newglosary.valid) {
      this.changeglosaryform.glossary_type = this.glosary_type;
      this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.changeglosaryform, query: 'glossary', pdata: { id: 'id', value: this.changeglosaryform.id } } })
        .pipe(
          concatMap(res => {
            const mode = this.glosary_form_btntitle == 'UPDATE';
            const glossaryEvent: ITrackGlossaryEvent = {
              event: !mode ? TrackGlossaryEvent.TYPE_GL_ADDED : TrackGlossaryEvent.TYPE_GL_EDITED,
              glTitle: this.changeglosaryform.golssary_name,
              glType: this.changeglosaryform.glossary_type,
              glData: JSON.stringify(this.changeglosaryform)
            };
            return this.trackingService.trackGlossaryEvent({
              type: TrackingTypes.TYPE_GLOSSARY,
              uid: this.cs.user_session.id,
              data: JSON.stringify(glossaryEvent)
            }).pipe(map(_ => res))
          })
        )
        .subscribe((data: any) => {
          //console.log(JSON.stringify(data));
          if (data.status == 1) {
            $('#tbllistid').DataTable().ajax.reload();
            this.cs.openGrowl('', "Status", "Submitted Successfully");
            //  newglosary.reset();
            this.changeglosaryform = { id: '', golssary_name: '', description: '', glossary_type: 0 }
            this.showglosaryform = false;
            this.addglosary.hide();
          } else {
            this.cs.openGrowl('', "Status", "Some error ocured");
          }
        });
    } else {
      this.glosary_validation = "Fill out mandatory Fields";
    }
  }


  reloadTable() {
    // this.dtElement.dtInstance.then(instance => instance.ajax.reload());
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.printDataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }
}
