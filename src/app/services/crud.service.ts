import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

var headers = new Headers({
  "Content-Type": "application/json",
  "Accept": "application/json",
  //'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Origin': '*',
  "Access-Control-Allow-Methods": 'DELETE, POST, GET, OPTIONS'
});

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json', 
  "Accept": "application/json",
  //'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Origin': '*',
  "Access-Control-Allow-Methods": 'DELETE, POST, GET, OPTIONS'})
}

@Injectable({
  providedIn: 'root'
})
export class CrudService {

  //private timeOut_api_url: string = 'https://localhost:44309/api';   //this is for development purposes
  //private timeOut_api_url: string = 'https://eimweb4w19/TimeOut/data/api/api';   //this is for test purposes ****works
  private timeOut_api_url: string = 'https://eimweb4w19/TimeOut/data/api';   //this is for test purposes   ***works
  
  constructor(private httpClient: HttpClient) { }

  public GetPathologists(): Observable<any> {
    console.log("about to get-pathologists");
    return this.httpClient.get(this.timeOut_api_url + '/TimeOut/get-pathologists')
  }

  public GetStaffList(): Observable<any> {
    console.log("about to get-staff-list");
    return this.httpClient.get(this.timeOut_api_url + '/TimeOut/get-staff-list')
  }

  public verfiyFrozenFna(selectedDate: string): Observable<any> {
     console.log("about to get verify-frozen-fna for selectedDate: "+selectedDate);
     return this.httpClient.get(this.timeOut_api_url + '/TimeOut/verify-frozen-fna?selectedDate=' + selectedDate)
   }

   public verfiyCoverageDay(requestedPath: number, selectedDate: string): Observable<any> {
     console.log("about to get verify-coverage-day for selectedDate: "+selectedDate+" and requestedPath: "+requestedPath);
     console.log("using this URL for verifyCoverageDay: "+ this.timeOut_api_url + '/TimeOut/verify-coverage-day?requestedPath=' + requestedPath+'&selectedDate=' + selectedDate);
     return this.httpClient.get(this.timeOut_api_url + '/TimeOut/verify-coverage-day?pathItn=' + requestedPath+'&selectedDate=' + selectedDate)
   }

   public verfiyMaxPathologists(selectedDate: string, staffList: string, requestedPath: number) {
    console.log("about to get verify-max-pathologists for selectedDate: "+selectedDate+" and requestedPath: "+requestedPath+" and staffList: "+staffList);
    return this.httpClient.get<any>(this.timeOut_api_url + '/TimeOut/verify-max-pathologists?selectedDate='+ selectedDate + '&staffList=' + staffList + '&pathItn=' + requestedPath, httpOptions)
  }
}
