import { Component, OnInit } from '@angular/core';
import { HttpClient,HttpClientModule,HttpErrorResponse } from "@angular/common/http";
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { FormBuilder, FormGroup, FormArray, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { CrudService } from './services/crud.service';
import { DatePipe } from '@angular/common';
import { addDays, eachDayOfInterval } from "date-fns";
import { NativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [CrudService]
})
export class AppComponent implements OnInit{
  assetsLocation: string ='assets/TimeOut_icon.png';    // for dev on your pc
  //assetsLocation: string ='../assets/TimeOut_icon.png';    // for server locations

  title = 'TimeOut';
  isLoading = false;
  //waitSpin = document.getElementById("spinner");
  //today's date
  todayDate:Date = new Date();

  startDate = new FormControl(new Date());
  endDate = new FormControl(new Date());
  prettyStartDate: string | undefined;
  prettyEndDate: string | undefined;
  //dates: Date[] | undefined;
  dates: Array<string>=[];
  datesCount: number = 0;
  datesProcessed: number = 0;

  allPaths: Array<Pathologist>=[];
  staffListing: Array<number>=[];
  staffList: string = "";
  requestedPath: number = -1;
  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();
  dayArray: Array<DayDetails> = [];
  sortedDayArray: Array<DayDetails> = [];
  dataDone: boolean = false;
 // offset:number | undefined;

  constructor(private httpClient: HttpClient, private CrudService: CrudService, public datepipe: DatePipe){
  }

  ngOnInit(){
    // get pathologist list for the requestor dropdown
   this.CrudService.GetPathologists().subscribe({
      next: (data: any) => this.allPaths = data,
      error: (e: string) => console.log("An error accessing GetPathologists"+e),
      complete: () => console.log("allPaths is: "+JSON.stringify(this.allPaths))
    });

    // staff list is used when verifying coverage, but it doesn't change, so let's get it at the start of the app
    this.CrudService.GetStaffList().subscribe({
      next: (data: any) => {this.staffList = data, this.readyStaffList()},
      error: (e: string) => console.log("An error accessing GetStaffList"+e),
      complete: () => console.log("staffList is: "+JSON.stringify(this.staffList))
    });

  //  this.staffList = "("+this.staffList+")";

   // this.staffList = JSON.stringify(this.staffList);
  //  console.log("staffList after parentheses is: "+this.staffList);
    
    // get the time zone offset we need when making the pretty dates
   // this.offset = (new Date().getTimezoneOffset());
  }

  readyStaffList(){
    this.staffList = "("+this.staffList+")";
    //console.log("staffList after parentheses is: "+this.staffList);
  }

  setRqst(evt:any) {
    console.log("the path itn is: ..."+evt.target.value+"...the id is: ..."+(<HTMLElement>evt.target).id);
   // var rqstItn = evt.target.value;  // this is the path itn that was selected as the requestor
    this.requestedPath = evt.target.value;  // this is the path itn that was selected as the requestor
    console.log("this.requestorValue is: ..."+this.requestedPath);
  }

  saveStartDate(evt:any) {
    this.selectedStartDate = evt.target.value;
    console.log("this.selectedStartDate is: ..."+this.selectedStartDate);
    this.prettyStartDate = this.datepipe.transform(this.selectedStartDate, 'yyyy-MM-dd') ?? '';
    console.log("this.prettyStartDate is: ..."+this.prettyStartDate);
  }

  saveEndDate(evt:any) {
    this.selectedEndDate = evt.target.value;
    console.log("this.selectedEndDate is: ..."+this.selectedEndDate);
    this.prettyEndDate = this.datepipe.transform(this.selectedEndDate, 'yyyy-MM-dd') ?? '';
    console.log("this.prettyEndDate is: ..."+this.prettyEndDate);
  }

  getColor(podItem: PodArray){
   // console.log("in getColor... podItem is: "+JSON.stringify(podItem));
    return podItem.pod_status_color;
    //return 'red';
  }

  getClass(podItem: PodArray){
   // console.log("in getColor... podItem is: "+JSON.stringify(podItem));
    if ((podItem.pod_status_color == 'red')||(podItem.pod_status_color == 'green')) {
      return 'lightText';
    }
    else {
      return 'darkText';
    }
  }

  getDaysArray = (start:Date, end:Date) => {

    console.log("in getDaysArray... start is: "+start+"... end is: "+end);
    var arr=[];

    if (start > end) {
      //arr.push(new Date(start));
      arr.push(this.datepipe.transform(start, 'yyyy-MM-dd') ?? '');
    }
    else {
      for(var dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)) {
       // arr.push(new Date(dt));
       arr.push(this.datepipe.transform(dt, 'yyyy-MM-dd') ?? '');
      }
     // for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
     //   arr.push(new Date(dt));
    }

    console.log("date array is: "+arr);

    return arr;
  }

  async clickme() {

    console.log("TimeOut start of clickme");
    console.log("in clickme... this.prettyStartDate is: ..."+this.prettyStartDate+"... actual start date is: "+this.selectedStartDate);
    console.log("in clickme... this.prettyEndDate is: ..."+this.prettyEndDate+"... actual end date is: "+this.selectedEndDate);
    console.log("in clickme... this.requestedPath is: ..."+this.requestedPath);

    this.dates = this.getDaysArray(this.selectedStartDate, this.selectedEndDate);
    this.datesCount = this.dates.length;   // when we've procssed this many, we're done and can display the data
    this.datesProcessed = 0;   // initialize
    
    this.dataDone = false;   // erase previous results if they are shown
    this.isLoading = true;   // start the spinner
    this.sortedDayArray = [];  // erase any data that may have been in here
    this.dayArray = [];      // erase any data that may have been in here

    console.log("dates are: ..."+this.dates+" and datesCount is: "+this.datesCount);

    for(let i=0; i<this.dates.length; i++){
      var prettyDate = this.datepipe.transform(this.dates[i], 'yyyy-MM-dd') ?? '';
      console.log("now getting data for date: ..."+prettyDate);

      var frozenFNA: string[] = [];
      var coverageDetails: Array<PodArray> = [];
      var maxDetails: Array<MaxArray> = [];

      // we need to run 3 services to get the coverage details for this date
      // get the Frozen FNA array
      let verifyFrozen = this.CrudService.verfiyFrozenFna(prettyDate);
      // verify coverage day
      let verifyCovDay = this.CrudService.verfiyCoverageDay(this.requestedPath, prettyDate);
      // verify max pathologists
      let vefifyMaxPaths = this.CrudService.verfiyMaxPathologists(prettyDate, this.staffList, this.requestedPath);

     /* forkJoin([verifyFrozen, verifyCovDay]).subscribe((result) => {
        //console.log("result 0 is: "+JSON.stringify(result[0])+" result 1 is: "+JSON.stringify(result[1]));
        frozenFNA=result[0];
        coverageDetails=result[1];
        this.getMaxDetails(frozenFNA, coverageDetails, prettyDate);
        //this.addToDayArray(frozenFNA, coverageDetails, prettyDate);  
      }); */
      // we need to include the coverage date in the coverageDetails return array, because if we pass prettyDate to addToDayArray, 
      // the async nature of processing passes the wrong date by the time the forkjoin processes complete

       forkJoin([verifyFrozen, verifyCovDay, vefifyMaxPaths]).subscribe((result) => {
        //console.log("result 0 is: "+JSON.stringify(result[0])+" result 1 is: "+JSON.stringify(result[1])+" result 2 is: "+JSON.stringify(result[2]));
        frozenFNA=result[0];
        coverageDetails=result[1];
        maxDetails=result[2];
        this.addToDayArray(frozenFNA, coverageDetails, maxDetails); 
        //this.addToDayArray(frozenFNA, coverageDetails, maxDetails, prettyDate); 
      });  
           
    } 
  }

  dayOfWeekAsString(dayIndex: number) {
    return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex] || '';
  }

  addToDayArray(frozenFNA:string[], coverageDetails:Array<PodArray>, maxDetails:Array<MaxArray>) {

    //console.log("frozenFNA is: "+JSON.stringify(frozenFNA));
    //console.log("coverageDetails is: "+JSON.stringify(coverageDetails));
    // get the coverage day from the coverageDetails
    var thisDate = coverageDetails[0].coverage_day;

    // Dr. Prichard wants to see the day of the week also
    var convertedDate = new Date(coverageDetails[0].coverage_day);
    var dayOfWeek = this.dayOfWeekAsString(convertedDate.getDay());

    var dayResults: DayDetails = {coverage_day: "",
                                    day_of_week: "",
                                    frozen_fna: [],
                                    total_pathologists_out: 0,
                                    max_details: [],
                                    coverage_details: [] }

    // now build the object containing results for this date
    dayResults.coverage_day = thisDate;
    dayResults.day_of_week = dayOfWeek;
    dayResults.frozen_fna = frozenFNA;
    dayResults.total_pathologists_out = maxDetails.length;
    dayResults.max_details = maxDetails;
    dayResults.coverage_details = coverageDetails;

   // console.log("dayResults for date"+prettyDate+" is: "+JSON.stringify(dayResults));

    // and add that object to the array used when displaying the coverage resutls
    this.dayArray.push(dayResults);

    //console.log("dayArray is: "+JSON.stringify(this.dayArray));

    this.datesProcessed = this.datesProcessed + 1;

    console.log("this many dates have been processed: "+this.datesProcessed);

    if (this.datesProcessed == this.datesCount) {
      // we need to sort the dayArray by the date because it may not be in the correct date order now
      this.sortedDayArray = this.dayArray.sort((a, b) => (a.coverage_day < b.coverage_day) ? -1 : 1);

      // now we can show the results
      this.isLoading = false;   // stop the spinner
      this.dataDone = true;
      console.log("data has all been processed!");
      //console.log("dayArray is: "+JSON.stringify(this.sortedDayArray));

      // let's disable the Check Coverage button and make sure the user has to re-enter dates if he wants to check again
      this.prettyStartDate = undefined;
     // this.prettyEndtDate = undefined;
    }

  }
}

export interface Pathologist {
  path_itn: number;
  path_last: string;
  path_first: string;
  path_email: string;
  path_name: string;
}

export interface PodArray {
  coverage_day: string;
  pod_desc: string;
  pod_status: number;
  pod_status_color: string;
  pod_pathologists_available: number;
  pod_pathologists_out: Array<MaxArray>;
  pod_pathologists_in: Array<MaxArray>;
  pod_threshold: number;
  pod_busy_day: boolean;
  rowcount: number;
}

export interface MaxArray {
  path_last: string;
  path_first: string;
  type_desc: string;
}

export interface DayDetails {
  coverage_day: string;
  day_of_week: string;
  frozen_fna: string[];
  total_pathologists_out: number;
  max_details: Array<MaxArray>;
  coverage_details: Array<PodArray>;
}
