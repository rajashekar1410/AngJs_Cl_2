import {Component,Injectable,ViewChild, HostListener,OnInit,Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'started',
  pure: false,
})
export class StartedPipe implements PipeTransform {
  transform(listing_columns: any[], args: any): any {
    // filter items array, items which match and return true will be kept, false will be filtered out
    return listing_columns.filter(listing_column => listing_column.display.indexOf(args.display) !== -1);
  }
}
