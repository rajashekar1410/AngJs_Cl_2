import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { ITrackGlossaryEvent, TrackGlossaryEvent } from 'src/app/shared/modules/user-tracking/models/track-glossary';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { CommonService } from '../common/common.service';
import { IetmModalService } from '../ietm-modal/ietm-modal.service';

@Injectable({
  providedIn: 'root'
})
export class ListingService {

  public listing_columns = [];
  public listing_data = [];
  public data_loaded = 0;
  public listing_filters = { limit: 0, offset: 0, ordercolumn: '', ordertype: '', selected_colnames: [], search_keyword: '', search_query: '', query: '', filtercols: {} };
  public managelist = {};
  public offset_show = Number(this.listing_filters['offset']) + Number("1");
  public offsetto_show = Number(this.listing_filters['offset']) + Number(this.listing_filters['limit']);
  public finalset = 0;
  show_colselection = '0';
  public selectedAll = 0;
  public enableseldelete = 0;
  @ViewChild('quesstring') public questr: ElementRef;
  constructor(public commonservice: CommonService, public mdls: IetmModalService, private trackingService: UserTrackingService) { }
  getlisting = function () {
    this.data_loaded = 0;
    // console.log("getlisting");
    this.listing_filters.search_query = "";
    // console.log(this.listing_filters.search_keyword );
    if (this.listing_filters.search_keyword !== "") {
      this.listing_filters.search_query = " where ( ";
      for (var i in this.listing_filters.selected_colnames) {
        //  this.listing_filters.search_query = this.listing_filters.search_query + "  " + this.listing_columns[i].column_name + " like '%" + this.listing_filters.search_keyword + "%' ";
        if (i === '0') {
          this.listing_filters.search_query = this.listing_filters.search_query + "  " + this.listing_filters.selected_colnames[i] + " like '%" + this.listing_filters.search_keyword + "%' ";
        }
        else if (i !== '0') {
          this.listing_filters.search_query = this.listing_filters.search_query + " or " + this.listing_filters.selected_colnames[i] + " like '%" + this.listing_filters.search_keyword + "%' ";
        }
      }
      this.listing_filters.search_query = this.listing_filters.search_query + " ) ";
    }
    //console.log(JSON.stringify(this.listing_filters)+"////listingfilters");
    this.commonservice.postData({ sourceid: 'listings', info: { listing_filters: this.listing_filters } })
      .subscribe(data => {
        // console.log(JSON.stringify(data));
        if (data.status == 1) {
          if (data.response.length > 0) {
            this.listing_data = data.response;
            for (var i = 0; i < this.listing_data.length; i++) {
              this.listing_data[i]['selected'] = false;
            }
            this.data_loaded = 1;
            //   console.log(JSON.stringify(this.listing_data));
            //     console.log("-------------");
            this.finalset = Number(data.listlength);
            if (Number(this.offsetto_show) > Number(this.finalset)) {
              this.offsetto_show = Number(this.finalset);
              //  console.log(this.offsetto_show+"////"+this.finalset)
            }
          }

          //console.log(this.listing_data +"////data");
        } else if (data.status == 0) {
          this.listing_data = [];
          this.listing_filters.limit = 10;
          this.listing_filters.offset = 0;
          this.offset_show = Number(this.listing_filters['offset']) + Number("1");
          this.offsetto_show = Number(this.listing_filters['offset']) + Number(this.listing_filters['limit']);
          this.finalset = 0;
          this.data_loaded = 1;
        }
      })
  }

  updateorder = function (column) {
    // console.log(JSON.stringify(sort));

    this.listing_filters.ordercolumn = column;
    this.listing_filters.ordertype = this.listing_filters.ordertype == 'asc' ? 'desc' : 'asc';
    this.getlisting();
  }
  getsearchdata = function () {
    this.listing_filters.offset = '0';
    this.offset_show = Number(this.listing_filters.offset) + Number("1");
    this.offsetto_show = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);
    this.getlisting();
  }
  closecolumns = function () {
    this.show_colselection = '0';
  }
  /*updatelimit = function (value) {
    //////////console.log('jehfjhjj');
    this.listing_filters.limit = value;
    this.getlisting();
  }*/
  updatelimit = function (value) {
    ////////console.log('jehfjhjj');
    this.listing_filters.limit = value;
    this.listing_filters.offset = '0';
    this.offsetto_show = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);

    this.getlisting();
  }
  updateoffset = function (type) {
    //  ////////console.log("final set"+this.finalset+this.listing_filters.limit+"limit//"+this.listing_filters.offset);
    if (type === "first") {
      this.listing_filters.offset = '0';
      this.offset_show = Number(this.listing_filters.offset) + Number("1");
      this.offsetto_show = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);
      this.getlisting();
    }
    else if (type === "prev" && this.listing_filters.offset !== '0') {
      this.listing_filters.offset = Number(this.listing_filters.offset) - Number(this.listing_filters.limit);
      this.offset_show = Number(this.listing_filters.offset) + Number("1");
      this.offsetto_show = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);
      this.getlisting();
    }
    else if (type === "next" && Number(this.listing_filters.offset) < Number(this.finalset)) {
      // console.log(this.listing_filters.offset+""+this.finalset);
      this.listing_filters.offset = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);
      // console.log(this.listing_filters.offset+""+this.listing_filters.limit);
      if (this.listing_filters.offset < this.finalset) {
        this.offset_show = Number(this.listing_filters.offset) + Number("1");
        this.offsetto_show = Number(this.listing_filters.offset) + Number(this.listing_filters.limit);
        this.getlisting();
      }
    }
    else if (type === "last" && Number(this.listing_filters.offset) !== Number(this.finalset)) {
      var finaloffest = (this.finalset - (this.finalset) % (this.listing_filters.limit));
      this.listing_filters.offset = finaloffest;
      this.offset_show = Number(finaloffest) + Number("1");
      this.offsetto_show = Number(this.finalset);
      this.getlisting();
    }
  }
  selectalltogleannots(st, id) {
    this.selectedAll = id;
    for (var i = 0; i < this.listing_data.length; i++) {
      if (this.commonservice.user_session.user_type <= 1 || this.commonservice.user_session.id == this.listing_data[i].created_by) {
        this.listing_data[i]['selected'] = st;
      }

    }
  }
  deleteenablecheck() {
    var dt = this.listing_data.filter(function (item: any) { return item['selected'] == true; })
    if (dt.length > 0) {
      this.enableseldelete = 1;
    } else {
      this.enableseldelete = 0;
    }
  }

  multiplerecdeletion(column: string, query: string) {
    const delarray = [], dataArray = [];
    for (const i in this.listing_data) {
      if (this.listing_data[i]['selected'] == true) {
        delarray.push(this.listing_data[i][column]);
        dataArray.push(this.listing_data[i]);
      }
      if (Number(i) == this.listing_data.length - 1) {
        // alert(JSON.stringify(delarray));
        this.commonservice.postData({ sourceid: 'list_rowdel', info: { query: query, column: column, selids: delarray } })
        .pipe(
          concatMap(res => {
            if (query != 'glossary') {
              return of(res);
            }
            const glossaryEvent: ITrackGlossaryEvent = {
              event: TrackGlossaryEvent.TYPE_GL_DELETED,
              glData: JSON.stringify(dataArray)
            };
            return this.trackingService.trackGlossaryEvent({
              type: TrackingTypes.TYPE_GLOSSARY,
              uid: this.commonservice.user_session.id,
              data: JSON.stringify(glossaryEvent)
            }).pipe(map(_ => res))
          })
        )  
        .subscribe(data => {
            if (data['status'] == 1) {
              // fix crash when WE removed from WordExplainers component.
              if (this.mdls.modalRef)
                this.mdls.modalRef.hide();
              $('#tbllistid').DataTable().ajax.reload();
              this.commonservice.openGrowl('', 'Status', 'Deleted selected rows Successfully');
              this.getlisting();
            } else {
              this.commonservice.openGrowl('', 'Status', 'Some error occured');
            }
          })
      }
    }
  }
  selectalltogle(st, id) {
    this.selectedAll = id;
    for (var i = 0; i < this.listing_data.length; i++) {

      this.listing_data[i]['selected'] = st;
    }
  }
}
