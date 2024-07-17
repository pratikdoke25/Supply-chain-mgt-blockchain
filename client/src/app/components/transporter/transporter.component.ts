import { Component, OnInit, ViewChild } from '@angular/core';
import { EthContractService } from '../../ethContract.service';
import { Router } from '@angular/router';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { RawMaterial } from './rawmattable';
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
  selector: 'app-user-transporter',
  templateUrl: './transporter.component.html',
  styleUrls: ['./transporter.component.css'],
})
export class TransporterComponent implements OnInit {
  account = '0x0';
  balance = '0 ETH';
  amount = 0;
  name: any;
  location: any;
  role: any;
  consignmentCount: any;
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
  ConsignmentStatus = {
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
  Consignment_list = [];
  displayedColumns: string[] = [
    'txtype',
    'batchid',
    // 'description',
    // 'farmername',
    // 'location',
    'quantity',
    // 'shipper',
    'from',
    'to',
    'status',
    'star',
  ];

  ConsignmentInfo = {
    Status: 0,
    Batch: {
      Done: false,
    },
    Shipper: {
      Done: false,
    },
    Manufacturer: {
      Done: false,
    },
  };
  ConsignmentDetails = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(16)]],
    farmername: ['', [Validators.required, Validators.maxLength(16)]],
    location: this.fb.group({
      latitude: [''],
      longitude: [''],
    }),
    quantity: [0, [Validators.required]],
    shipper: ['', [Validators.required]],
    receiver: ['', [Validators.required]],
  });
  dataSource: MatTableDataSource<RawMaterial>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private EthContractService: EthContractService,
    private fb: FormBuilder
  ) {
    localStorage.setItem('shipperConsignmentIdPointer', 0 + '');
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

        if (acctInfo.Role.Role != 2) {
          window.alert('User is not Transporter.');
          that.router.navigate(['/']);
        } else {
          that.transportCount();
        }
      })
      .catch(function (error) {
        console.log(error);
        that.router.navigate(['/']);
      });
  };

  transportCount = async () => {
    let that = this;
    const consignmentCount = await this.EthContractService.transportCount();
    that.consignmentCount = consignmentCount;
    that.getConsignmentInfo();
  };

  getConsignmentInfo = async () => {
    let that = this;
    let iterate = true;
    let from = Number(localStorage.getItem('shipperConsignmentIdPointer'));
    let to: Number;
    if (that.consignmentCount < from + 5) {
      to = that.consignmentCount;
      localStorage.setItem('shipperConsignmentIdPointer', to + '');
      iterate = false;
    } else if (that.consignmentCount > from + 5) {
      to = from + 5;
      localStorage.setItem('shipperConsignmentIdPointer', to + '');
    }
    let i: number;
    for (i = from; i < to; i++) {
      await this.EthContractService.getTransportBatchIdByIndex({ Index: i })
        .then(async function (transportationReq: any) {
          if (transportationReq) {
            switch (transportationReq.tarnsType) {
              case 1:
                await that.EthContractService.getPackageBatchIDDetails({
                  BatchID: transportationReq.consignmentID,
                })
                  .then(function (ConsignmentInfo: any) {
                    if (ConsignmentInfo) {
                      let jsonRes = {
                        TxType: 1,
                        BatchID: transportationReq.consignmentID,
                        Quantity: ConsignmentInfo.Quantity,
                        Shipper: ConsignmentInfo.Shipper,
                        Receiver: ConsignmentInfo.Receiver,
                        Supplier: ConsignmentInfo.Supplier,
                        Status: that.ConsignmentStatus[ConsignmentInfo.Status],
                      };
                      that.Consignment_list.push(jsonRes);
                    }
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
              case 2:
                await that.EthContractService.getMedicineBatchIDDetails({
                  BatchID: transportationReq.consignmentID,
                })
                  .then(function (ConsignmentInfo: any) {
                    if (ConsignmentInfo) {
                      let jsonRes = {
                        TxType: 2,
                        BatchID: transportationReq.consignmentID,
                        Quantity: ConsignmentInfo.Quantity,
                        Shipper: ConsignmentInfo.Shipper,
                        Supplier: ConsignmentInfo.Manufacturer,
                        Receiver:
                          ConsignmentInfo.Wholesaler ===
                          '0x0000000000000000000000000000000000000000'
                            ? ConsignmentInfo.Distributer
                            : ConsignmentInfo.Wholesaler,
                        Status:
                          that.medicineBatchStatus[ConsignmentInfo.Status],
                      };
                      that.Consignment_list.push(jsonRes);
                    }
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
              case 3:
              case 4:
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
    this.dataSource = new MatTableDataSource<RawMaterial>(
      that.Consignment_list
    );
    this.dataSource.paginator = this.paginator;
    if (iterate) {
      that.getConsignmentInfo();
    }
  };

  getConsignmentTx = (selectedBatchID) => {
    let that = this;
    console.log(selectedBatchID);
    that.ConsignmentInfo['TxType'] = selectedBatchID.TxType;
    this.EthContractService.getRawMaterialStatus({
      BatchID: selectedBatchID.BatchID,
    })
      .then(function (response: any) {
        if (response) {
          that.ConsignmentInfo['Batch'] = selectedBatchID;
          that.EthContractService.getUsers({
            AccountAddress: selectedBatchID.Shipper,
          }).then(function (shipperInfo: any) {
            if (shipperInfo) {
              that.ConsignmentInfo['Shipper'] = shipperInfo.result;
              that.EthContractService.getUsers({
                AccountAddress: selectedBatchID.Receiver,
              }).then(function (ReceiverInfo: any) {
                if (ReceiverInfo) {
                  that.ConsignmentInfo['Receiver'] = ReceiverInfo.result;
                  that.ConsignmentInfo.Status = response.Status;
                  switch (response.Status) {
                    case 0: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      break;
                    }
                    case 1: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      that.ConsignmentInfo['Shipper']['Done'] = true;
                      break;
                    }
                    case 2: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      that.ConsignmentInfo['Shipper']['Done'] = true;
                      that.ConsignmentInfo['Receiver']['Done'] = true;
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
    this.EthContractService.getMedicineStatus({
      BatchID: selectedBatchID.BatchID,
    })
      .then(function (response: any) {
        if (response) {
          that.ConsignmentInfo['Batch'] = selectedBatchID;
          that.EthContractService.getUsers({
            AccountAddress: selectedBatchID.Shipper,
          }).then(function (shipperInfo: any) {
            if (shipperInfo) {
              that.ConsignmentInfo['Shipper'] = shipperInfo.result;
              that.EthContractService.getUsers({
                AccountAddress: selectedBatchID.Receiver,
              }).then(function (receiver: any) {
                console.log(receiver);
                if (receiver) {
                  that.ConsignmentInfo['Receiver'] = receiver.result;
                  that.ConsignmentInfo['Status'] = response.Status;
                  switch (response.Status) {
                    case 0: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      break;
                    }
                    case 1: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      that.ConsignmentInfo['Shipper']['Done'] = true;
                      break;
                    }
                    case 3: {
                      that.ConsignmentInfo['Batch']['Done'] = true;
                      that.ConsignmentInfo['Shipper']['Done'] = true;
                      that.ConsignmentInfo['Receiver']['Done'] = true;
                      break;
                    }
                  }
                  console.log(that.ConsignmentInfo);
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

  pickConsignment = (pid, txtype, cid) => {
    console.log(this.ConsignmentDetails.value);
    let that = this;
    var formdata = {
      ConsignmentID: pid,
      TransporterType: txtype,
      SubContractID: cid,
    };
    console.log(formdata);
    this.EthContractService.loadConsingment(formdata)
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
