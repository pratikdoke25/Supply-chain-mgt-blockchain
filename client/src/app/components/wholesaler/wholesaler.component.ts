import { Component, OnInit, ViewChild } from '@angular/core';
import { EthContractService } from '../../ethContract.service';
import { Router } from '@angular/router';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { Medicine } from './medicineTable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  Validators,
  FormControl,
  NgSelectOption,
} from '@angular/forms';
import { async } from 'q';
import * as $ from 'jquery';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-wholesaler',
  templateUrl: './wholesaler.component.html',
  styleUrls: ['./wholesaler.component.css'],
})
export class WholesalerComponent implements OnInit {
  account = '0x0';
  balance = '0 ETH';
  amount = 0;
  name: any;
  location: any;
  role: any;
  batchCount: any;
  Roles = {
    0: 'NoRole',
    1: 'Supplier',
    2: 'Transporter',
    3: 'Manufacturer',
    4: 'Wholesaler',
    5: 'Distributer',
    6: 'Pharma',
    7: 'Role Revoked',
  };
  packageStatus = {
    0: 'At Creator',
    1: 'Picked',
    2: 'Delivered',
  };
  medicineBatchStatus = {
    0: 'At Creator',
    1: 'Picked for Wholesaler',
    2: 'Picked for Distributor',
    3: 'Delivered at Wholesaler',
    4: 'Delivered at Distributor',
    5: 'Picked for Pharma',
    6: 'Delivered at Pharma',
  };
  batch_list = [];
  displayedMedicineColumns: string[] = [
    'batchId',
    'description',
    'rawMaterial',
    'quantity',
    'shipper',
    'status',
    'star',
  ];
  batchInfo = {};
  MedicineSource: MatTableDataSource<Medicine>;
  packageReceivePid = this.fb.group({
    pid: ['', [Validators.required]],
  });

  // dataSource: MatTableDataSource<Medicine>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private EthContractService: EthContractService,
    private fb: FormBuilder
  ) {
    localStorage.setItem('batchAtMpointer', 0 + '');
    this.initAndDisplayAccount();
  }

  ngOnInit() {}

  initAndDisplayAccount = () => {
    let that = this;
    this.EthContractService.getRole()
      .then(function (acctInfo: any) {
        that.account = acctInfo.Account;
        that.balance = acctInfo.Balance;
        that.name = acctInfo.Role.Name;
        that.location = acctInfo.Role.Location;
        that.role = that.Roles[acctInfo.Role.Role];

        if (acctInfo.Role.Role != 4) {
          window.alert('User is not Wholesaler.');
          that.router.navigate(['/']);
        } else {
          that.getBatchCount();
        }
      })
      .catch(function (error) {
        console.log(error);
        that.router.navigate(['/']);
      });
  };

  getBatchCount = async () => {
    let that = this;
    await this.EthContractService.getBatchesCountW().then(function (
      batchCount: any
    ) {
      that.batchCount = batchCount;
    });
    that.getBatchesInfo();
  };

  getBatchesInfo = async () => {
    let that = this;
    let iterate = true;
    let from = Number(localStorage.getItem('batchAtMpointer'));
    let to: Number;
    if (that.batchCount < from + 5) {
      to = that.batchCount;
      localStorage.setItem('batchAtMpointer', to + '');
      iterate = false;
    } else if (that.batchCount > from + 5) {
      to = from + 5;
      localStorage.setItem('batchAtMpointer', to + '');
    }
    let i: number;
    for (i = from; i < to; i++) {
      await this.EthContractService.getBatchIdByIndexW({ Index: i })
        .then(async function (batchId: any) {
          if (batchId) {
            await that.EthContractService.getMedicineBatchIDDetails({
              BatchID: batchId,
            }).then(function (batchInfo: any) {
              if (batchInfo) {
                let jsonRes = {
                  BatchID: batchId,
                  Manufacturer: batchInfo.Manufacturer,
                  Description: batchInfo.Description,
                  RawMaterial: batchInfo.RawMaterial,
                  Quantity: batchInfo.Quantity,
                  Shipper: batchInfo.Shipper,
                  Status: that.medicineBatchStatus[batchInfo.Status],
                  Wholesaler: batchInfo.Wholesaler,
                  Distributer: batchInfo.Distributer,
                  Pharma: batchInfo.Pharma,
                };
                that.batch_list.push(jsonRes);
              }
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
    this.MedicineSource = new MatTableDataSource<Medicine>(that.batch_list);
    this.MedicineSource.paginator = this.paginator;
    if (iterate) {
      that.getBatchesInfo();
    }
  };

  getBatchTx = (selectedBatchID) => {
    let that = this;
    that.batchInfo['Status'] = -1;
    (selectedBatchID.Receiver =
      selectedBatchID.Wholesaler ===
      '"0x0000000000000000000000000000000000000000"'
        ? selectedBatchID.Distributer
        : selectedBatchID.Wholesaler),
      this.EthContractService.getMedicineStatus({
        BatchID: selectedBatchID.BatchID,
      })
        .then(function (response: any) {
          if (response) {
            that.batchInfo['Batch'] = selectedBatchID;
            that.EthContractService.getUsers({
              AccountAddress: selectedBatchID.Shipper,
            }).then(function (shipperInfo: any) {
              if (shipperInfo) {
                that.batchInfo['Shipper'] = shipperInfo.result;
                that.EthContractService.getUsers({
                  AccountAddress: selectedBatchID.Receiver,
                }).then(function (receiver: any) {
                  if (receiver) {
                    that.batchInfo['Receiver'] = receiver.result;
                    that.batchInfo['Status'] = response.Status;
                    switch (response.Status) {
                      case 0: {
                        that.batchInfo['Batch']['Done'] = true;
                        break;
                      }
                      case 1: {
                        that.batchInfo['Batch']['Done'] = true;
                        that.batchInfo['Shipper']['Done'] = true;
                        break;
                      }
                      case 3: {
                        that.batchInfo['Batch']['Done'] = true;
                        that.batchInfo['Shipper']['Done'] = true;
                        that.batchInfo['Receiver']['Done'] = true;
                        break;
                      }
                    }
                  }
                });
              }
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
  };

  medicinePackageReceived = () => {
    let that = this;
    var formData = {
      PackageID: this.packageReceivePid.value.pid,
      SubContractID: '0x0000000000000000000000000000000000000000',
    };
    this.EthContractService.medicineReceived(formData)
      .then(function (txhash: any) {
        if (txhash) {
          that.handleTransactionResponse(txhash);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  handleTransactionResponse = (txHash) => {
    var txLink = 'https://ropsten.etherscan.io/tx/' + txHash;
    var txLinkHref =
      "<a target='_blank' href='" +
      txLink +
      "'> Click here for Transaction Status </a>";

    Swal.fire(
      'Success',
      'Please Check Transaction Status here :  ' + txLinkHref,
      'success'
    );
    $('#linkOngoingTransaction').html(txLinkHref);
    $('#divOngoingTransaction').fadeIn();
    /*scroll to top*/
    $('html, body').animate({ scrollTop: 0 }, 'slow', function () {});
  };
}
