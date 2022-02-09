import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingListingComponent } from './components/tracking-listing/tracking-listing.component';
import { DataTablesModule } from 'angular-datatables';
import { MomentModule } from 'ngx-moment';
import { UserLoginsListingComponent } from './components/user-logins-listing/user-logins-listing.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [TrackingListingComponent, UserLoginsListingComponent],
  imports: [
    CommonModule,
    DataTablesModule,
    MomentModule,
    BsDropdownModule,
    BsDatepickerModule,
    FormsModule
  ],
  exports: [TrackingListingComponent, UserLoginsListingComponent]
})
export class UserTrackingModule { }
