import { Component, OnInit, ViewChild } from '@angular/core';
import { EthContractService } from '../../ethContract.service';
import { Router } from '@angular/router';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { RawMaterial } from './rawMatTable';
import { Medicine } from './medicineTable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  Validators,
  FormControl,
  NgSelectOption,
  FormArray,
} from '@angular/forms';
import { async } from 'q';
import * as $ from 'jquery';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-manufacturer',
  templateUrl: './manufacturer.component.html',
  styleUrls: ['./manufacturer.component.css'],
})
export class ManufacturerComponent implements OnInit {
  // quantity: any[]=[];
  account = '0x0';
  balance = '0 ETH';
  amount = 0;
  name: any;
  location: any;
  role: any;
  rawRemain: {};
  rawPackageCount: 0;
  batchCount: 0;
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
  package_list = [];
  batch_list = [];
  displayedColumns: string[] = [
    'batchId',
    'location',
    'initQuantity',
    'usedQuantity',
    'shipper',
    'receiver',
    'status',
    'star',
  ];

  displayedMedicineColumns: string[] = [
    'batchId',
    'description',
    'rawMaterial',
    'quantity',
    'shipper',
    'status',
    'star',
  ];

  packageInfo = {};
  batchInfo = {};
  rawSource: MatTableDataSource<RawMaterial>;

  medicineDetails = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(16)]],
    quantity: [0, [Validators.required]],
    shipper: ['', [Validators.required]],
    receiver: ['', [Validators.required]],
    receiverType: [1, [Validators.required]],
    rawMaterial: this.fb.group({
      pid: [''],
      quantity: [0],
    }),
  });

  MedicineSource: MatTableDataSource<Medicine>;
  rawReceivePid = this.fb.group({
    pid: ['', [Validators.required]],
  });

  @ViewChild(MatPaginator) paginator: MatPaginator;
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private EthContractService: EthContractService,
    private fb: FormBuilder
  ) {
    localStorage.setItem('rawPackageAtMpointer', 0 + '');
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

        if (acctInfo.Role.Role != 3) {
          window.alert('User is not Manufacturer.');
          that.router.navigate(['/']);
        } else {
          that.getPackagesCountM();
          that.getBatchesCountM();
        }
      })
      .catch(function (error) {
        console.log(error);
        that.router.navigate(['/']);
      });
  };

  getPackagesCountM = async () => {
    let that = this;
    await this.EthContractService.getPackagesCountM().then(function (
      packageCount: any
    ) {
      that.rawPackageCount = packageCount;
    });
    that.getPackageInfo();
  };
  getBatchesCountM = async () => {
    let that = this;
    await this.EthContractService.getBatchesCountM().then(function (
      batchCount: any
    ) {
      that.batchCount = batchCount;
    });
    that.getBatchesInfo();
  };

  rawPackageReceived = () => {
    let that = this;
    var formData = {
      PackageID: this.rawReceivePid.value.pid,
    };
    this.EthContractService.rawPackageReceived(formData)
      .then(function (txhash: any) {
        if (txhash) {
          that.handleTransactionResponse(txhash);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  getPackageInfo = async () => {
    let that = this;
    let iterate = true;
    let from = Number(localStorage.getItem('rawPackageAtMpointer'));
    let to: Number;
    if (that.rawPackageCount < from + 5) {
      to = that.rawPackageCount;
      localStorage.setItem('rawPackageAtMpointer', to + '');
      iterate = false;
    } else if (that.rawPackageCount > from + 5) {
      to = from + 5;
      localStorage.setItem('rawPackageAtMpointer', to + '');
    }
    let i: number;
    for (i = from; i < to; i++) {
      await this.EthContractService.getPackageIDByIndexM({ Index: i })
        .then(async function (batchId: any) {
          if (batchId) {
            await that.EthContractService.getPackageBatchIDDetails({
              BatchID: batchId,
            }).then(function (packageInfo: any) {
              if (packageInfo) {
                let jsonRes = {
                  BatchID: batchId,
                  FarmLocation: packageInfo.FarmLocation,
                  InitQuantity: packageInfo.Quantity,
                  UsedQuantity: packageInfo.UsedQuantity,
                  Shipper: packageInfo.Shipper,
                  Receiver: packageInfo.Receiver,
                  Supplier: packageInfo.Supplier,
                  Status: that.packageStatus[packageInfo.Status],
                };
                that.package_list.push(jsonRes);
              }
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
    this.rawSource = new MatTableDataSource<RawMaterial>(that.package_list);
    this.rawSource.paginator = this.paginator;
    if (iterate) {
      that.getPackageInfo();
    }
  };

  getPackageTx = (selectedBatchID) => {
    let that = this;
    that.packageInfo['Status'] = -1;
    this.EthContractService.getRawMaterialStatus({
      BatchID: selectedBatchID.BatchID,
    })
      .then(function (response: any) {
        if (response) {
          that.packageInfo['Batch'] = selectedBatchID;
          that.EthContractService.getUsers({
            AccountAddress: selectedBatchID.Shipper,
          }).then(function (shipperInfo: any) {
            if (shipperInfo) {
              that.packageInfo['Shipper'] = shipperInfo.result;
              that.EthContractService.getUsers({
                AccountAddress: selectedBatchID.Receiver,
              }).then(function (manufacturerInfo: any) {
                if (manufacturerInfo) {
                  that.packageInfo['Manufacturer'] = manufacturerInfo.result;
                  that.packageInfo['Status'] = response.Status;
                  switch (response.Status) {
                    case 0: {
                      that.packageInfo['Batch']['Done'] = true;
                      break;
                    }
                    case 1: {
                      that.packageInfo['Batch']['Done'] = true;
                      that.packageInfo['Shipper']['Done'] = true;
                      break;
                    }
                    case 2: {
                      that.packageInfo['Batch']['Done'] = true;
                      that.packageInfo['Shipper']['Done'] = true;
                      that.packageInfo['Manufacturer']['Done'] = true;
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

  manufactureMedicine = () => {
    let that = this;
    var formData = {
      Description: this.medicineDetails.value.description,
      RawMaterial: this.medicineDetails.value.rawMaterial.pid,
      Quantity: this.medicineDetails.value.quantity,
      UsedQuantity: this.medicineDetails.value.rawMaterial.quantity,
      Shipper: this.medicineDetails.value.shipper,
      Receiver: this.medicineDetails.value.receiver,
      ReceiverType: this.medicineDetails.value.receiverType,
    };
    console.log(formData);
    this.EthContractService.manufactureMedicine(formData)
      .then(function (txhash: any) {
        if (txhash) {
          console.log(txhash);
          that.handleTransactionResponse(txhash);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
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
      await this.EthContractService.getBatchIdByIndexM({ Index: i })
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

  // get rawMaterial() {
  //   return this.medicineDetails.get('rawMaterial') as FormArray;
  // }

  // addRawMat = () => {
  //   this.rawMaterial.push(
  //     this.fb.group({
  //       pid:[''],
  //       quantity:[0]
  //     }));
  // }

  // deleteRawMat = () => {
  //   this.rawMaterial.removeAt(this.rawMaterial.length - 1);
  // }

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
