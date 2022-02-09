import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/core/services/common/common.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(
    private cs: CommonService
  ) { }


  fetchInvTypes() {
    return this.cs.postData({
      sourceid: 'listings', info: {
        listing_filters: {
          filtercols: {}, query: 'inventory_types', selected_colnames: ['id', 'name'],
          search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'id', ordertype: 'asc'
        }
      }
    });
  }

}
