import { Component, OnInit, ViewChild, } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-testcomponent',
  templateUrl: './testComponent.component.html',
  styleUrls: ['./testComponent.component.css']
})
export class TestComponent implements OnInit {


  ngOnInit() { }
  one: true;
  two: true;
  three: true;
  four: true;
  five: true;
  six: true;
  seven: true;
}

