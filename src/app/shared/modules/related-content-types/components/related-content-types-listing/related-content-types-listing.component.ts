import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IETMTableEventTypes, IIETMTableEvent } from '../../../ietm-table/models/emit-event-type';
import { RelatedContentTypesAddUpdComponent } from '../related-content-types-add-upd/related-content-types-add-upd.component';
import { RelatedContentTypesDelComponent } from '../related-content-types-del/related-content-types-del.component';

@Component({
  selector: 'app-related-content-types-listing',
  templateUrl: './related-content-types-listing.component.html',
  styleUrls: ['./related-content-types-listing.component.scss']
})
export class RelatedContentTypesListingComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private bsModal: BsModalService,
    private http: HttpClient
  ) { }

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;

  dtOptions: ADTSettings = {};
  dtFilters = {}
  dtTrigger = new Subject();
  tbl_start = 0;
  tableName = "related_content_types";

  fetchDataSub$: Subscription = null;

  ngOnInit(): void {
    this.cs.emitChange('1');
    this.cs.page_header = 'Manage Related Content Types';

    this.initDTOptions();
  }

  ngAfterViewInit() {
    this.reloadTable();
  }

  initDTOptions() {
    const self = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: Name', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, order: [1, 'asc'], scrollY: "calc(100vh - 335px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = self.tableName;
        dataTablesParameters['dtfilters'] = self.dtFilters;
        dataTablesParameters['searchquery'] = " where name like '%" + dataTablesParameters['search']['value'] + "%' "
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        self.fetchDataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {})
          .subscribe(resp => {
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          },
            error => {
              console.log("Rrror", error);
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
            }
          );
      },
      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        {
          data: 'name',
          title: 'Content Type Name',
          orderable: true
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          visible: self.cs.user_session.user_type <= 1,
          createdCell: (cell) => {
            if (self.cs.user_session.user_type > 1) return;
            // clear old contents
            $(cell).html('');

            // column content
            const btn = $(`
            <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
              <i class="lni lni-cog">
            </button>
            `)
              .appendTo(cell as HTMLElement);

            const row: any = $("#tbllistid").DataTable().row(cell).data();
            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: "Edit Content Type", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "Delete Content Type", cmd: "delete", uiIcon: "ui-icon-trash" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    if (ui.cmd == 'edit') {
                      self.triggerAddUpdContentType(true, row);
                    } else if (ui.cmd == 'delete') {
                      self.triggerDelContentType(row);
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
        { targets: '_all', defaultContent: '' }
      ]
    };

    this.reloadTable();
  }

  triggerAddUpdContentType(isEditMode = true, contentId?: string) {
    const ref = this.bsModal.show(RelatedContentTypesAddUpdComponent, { class: this.cs.default_theme });
    this.cs.popdragabale();
    const content = ref.content as RelatedContentTypesAddUpdComponent;
    content.updateUI(isEditMode, contentId);
    const sub = content.triggerAddUpdCnt$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode ? 'Edited' : 'Added';
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Content Type ${msg} successfully`);
      } else {
        this.cs.openGrowl('', 'Status', `Content Type ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    })
  }

  triggerDelContentType(contentType) {
    const ref = this.bsModal.show(RelatedContentTypesDelComponent, { class: this.cs.default_theme });
    this.cs.popdragabale();
    // Set Content Typeinfo
    const content = ref.content as RelatedContentTypesDelComponent;
    content.contentTypeInfo = contentType;
    // Listen to delete finished event
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Content Type Deleted successfully');
        // fetch new data
        this.cs.refreshRelatedContentTypes();
      } else {
        this.cs.openGrowl('', 'Status', 'Content Type deletion failed.');
      }
    })
  }

  onTableEvent(event: IIETMTableEvent) {
    console.log(event)
    switch (event.type) {
      case IETMTableEventTypes.TYPE_ITEM_ADD:
        this.triggerAddUpdContentType(false);
        break;
    }
  }

  reloadTable() {
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
    this.fetchDataSub$?.unsubscribe();
  }

}
