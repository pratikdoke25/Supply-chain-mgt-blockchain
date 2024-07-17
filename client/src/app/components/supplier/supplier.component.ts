import { Component, OnInit, ViewChild, } from '@angular/core';
import { EthContractService } from '../../ethContract.service';
import { Router } from '@angular/router';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { RawMaterial } from './rawmattable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators, FormControl, NgSelectOption } from '@angular/forms';
import { async } from 'q';
import * as $ from 'jquery';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-user-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css']
})
export class SupplierComponent implements OnInit {

  account = "0x0";
  balance = '0 ETH';
  amount = 0;
  name: any;
  location: any;
  role: any;
  packageCount: any;
  Roles = {
    0: "NoRole",
    1: "Supplier",
    2: "Transporter",
    3: "Manufacturer",
    4: "Wholesaler",
    5: "Distributer",
    6: "Pharma",
    7: "Role Revoked"
  }
  packageStatus = {
    0: "At Creator",
    1: "Picked",
    2: "Delivered"
  }
  package_list = [];
  displayedColumns: string[] = [
    'batchid',
    'description',
    'farmername',
    'location',
    'quantity',
    'shipper',
    'receiver',
    'status',
    'star'
  ];

  packageInfo = {
    Status:0,
    Batch:{
      Done:false
    },
    Shipper:{
      Done:false
    },
    Manufacturer:{
      Done:false
    }
  };
  packageDetails = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(16)]],
    farmername: ['', [Validators.required, Validators.maxLength(16)]],
    location: this.fb.group({
      latitude: [''],
      longitude: ['']
    }),
    quantity: [0, [Validators.required]],
    shipper: ['', [Validators.required]],
    receiver: ['', [Validators.required]]
  });
  dataSource: MatTableDataSource<RawMaterial>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private EthContractService: EthContractService,
    private fb: FormBuilder
  ) {
    localStorage.setItem('packageidpointer', 0 + '');
    this.initAndDisplayAccount();
  }

  ngOnInit() { }

  initAndDisplayAccount = () => {
    let that = this;
    this.EthContractService.getRole().then(function(acctInfo: any) {
      console.log(acctInfo)

      that.account = acctInfo.Account;
      that.balance = acctInfo.Balance;
      that.name = acctInfo.Role.Name;
      that.location = acctInfo.Role.Location;
      that.role = that.Roles[acctInfo.Role.Role];

      if (acctInfo.Role.Role != 1) {
        window.alert("User is not Supplier.")
        that.router.navigate(['/']);
      } else {
        that.getPackageCount();
      }

    }).catch(function(error) {
      console.log(error);
      that.router.navigate(['/']);

    });
  }

  getPackageCount = async () => {
    let that = this;
    await this.EthContractService.getPackageCount().then(function(packageCount: any) {
      console.log(packageCount);
      that.packageCount = packageCount;
    })
    that.getPackageInfo();
  }

  getPackageInfo = async () => {
    let that = this;
    console.log(that.packageCount)
    // that.package_list = [];
    let itrate = true;
    let from = Number(localStorage.getItem('packageidpointer'));
    let to: Number;
    if (that.packageCount < from + 5) {
      to = that.packageCount;
      localStorage.setItem('packageidpointer', to + '');
      itrate = false;
    } else if (that.packageCount > from + 5) {
      to = from + 5;
      localStorage.setItem('packageidpointer', to + '');
    }
    let i: number;
    console.log(from,to)
    for (i = from; i < to; i++) {
      await this.EthContractService.getPackageBatchID({Index:i}).then(async function(batchid: any) {
        if (batchid) {
          console.log(batchid);
          await that.EthContractService.getPackageBatchIDDetails({BatchID:batchid}).then(function(packageinforesult: any) {
            if (packageinforesult) {
              console.log(packageinforesult);
              let jsonres = {
                "BatchID": batchid,
                "Description": packageinforesult.Description,
                "FarmerName": packageinforesult.FarmerName,
                "FarmLocation": packageinforesult.FarmLocation,
                "Quantity": packageinforesult.Quantity,
                "Shipper": packageinforesult.Shipper,
                "Receiver": packageinforesult.Receiver,
                "Supplier": packageinforesult.Supplier,
                "Status": that.packageStatus[packageinforesult.Status]
              }
              that.package_list.push(jsonres);
            }
          });
        }
      }).catch(function(error) {
        console.log(error);
      });
    }

    console.log(that.package_list);
    this.dataSource = new MatTableDataSource<RawMaterial>(that.package_list);
    this.dataSource.paginator = this.paginator;
    console.log(that.dataSource);
    if (itrate) {
      that.getPackageInfo();
    }
  }

  getPackageTx = (selectedBatchID) => {
    let that = this;
    console.log(selectedBatchID);
    that.packageInfo.Status = -1;
    this.EthContractService.getRawMaterialStatus({BatchID:selectedBatchID.BatchID}).then(function(response: any) {
      if (response) {
        that.packageInfo['Batch'] = selectedBatchID;
        that.EthContractService.getUsers({AccountAddress:selectedBatchID.Shipper}).then(function(shipperInfo: any) {
          if (shipperInfo) {
            console.log(shipperInfo);
            that.packageInfo['Shipper'] = shipperInfo.result;
            that.EthContractService.getUsers({AccountAddress: selectedBatchID.Receiver}).then(function(manufacturerInfo: any) {
              if (manufacturerInfo) {
                console.log(manufacturerInfo);
                that.packageInfo['Manufacturer'] = manufacturerInfo.result;
                that.packageInfo.Status = response.Status;
                console.log(that.packageInfo);

                console.log(response.Status);
                switch (response.Status) {
                  case 0:
                    {
                      console.log("At Creator");
                      that.packageInfo['Batch']['Done'] = true;

                      break;
                    }
                  case 1:
                    {
                      console.log("Picked Up");
                      that.packageInfo['Batch']['Done'] = true;
                      that.packageInfo['Shipper']['Done'] = true;
                      break;
                    }
                  case 2:
                    {
                      console.log("Delivered");
                      that.packageInfo.Batch.Done = true;
                      that.packageInfo.Shipper.Done = true;
                      that.packageInfo.Manufacturer.Done = true;
                      break;
                    }
                }
              }
            });
          }
        });

      }
    }).catch(function(error) {
      console.log(error);
    });

  }

  createPackage = () => {
    console.log(this.packageDetails.value);
    let that = this;
    var formdata = {
      Description: this.packageDetails.value.description,
      FarmerName: this.packageDetails.value.farmername,
      Location: this.packageDetails.value.location.latitude + "_" + this.packageDetails.value.location.longitude,
      Quantity: this.packageDetails.value.quantity,
      Shipper: this.packageDetails.value.shipper,
      Receiver: this.packageDetails.value.receiver
    }

    this.EthContractService.createRawPackage(formdata).then(function(txhash: any) {
      if (txhash) {
        console.log(txhash);
        that.handleTransactionResponse(txhash);
      }
    }).catch(function(error) {
      console.log(error);
    });
  }

  handleTransactionResponse = (txHash) => {
    var txLink = "https://ropsten.etherscan.io/tx/" + txHash;
    var txLinkHref = "<a target='_blank' href='" + txLink + "'> Click here for Transaction Status </a>";

    Swal.fire("Success", "Please Check Transaction Status here :  " + txLinkHref, "success");
    $("#linkOngoingTransaction").html(txLinkHref);
    $("#divOngoingTransaction").fadeIn();
    /*scroll to top*/
    $('html, body').animate({ scrollTop: 0 }, 'slow', function() { });
  }

}
