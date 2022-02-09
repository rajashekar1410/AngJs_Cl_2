import {Component,Injectable,ViewChild, HostListener,OnInit,Pipe, PipeTransform} from '@angular/core';



@Pipe({
  name: 'inarrayfilter'
})
@Injectable()
export class InArrayPipe implements PipeTransform {
  transform(items: any[], args: any[]): any {
    
    return items.filter(item => item.indexOf(args['id']) !== -1);
  }
}
