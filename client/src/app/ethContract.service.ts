import { Injectable } from '@angular/core';
import * as Web3 from 'web3';
declare let require: any;
declare let window: any;
let contract_SupplyChain = require('../../contracts/SupplyChain.json');
let contract_RawMaterials = require('../../contracts/RawMaterials.json');
let contract_MedicineW_D = require('../../contracts/MedicineW_D.json');
let contract_MedicineD_P = require('../../contracts/MedicineD_P.json');
let contract_Medicine = require('../../contracts/Medicine.json');

async function connect() {
  const handleAccountsChanged = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  return handleAccountsChanged;
}
@Injectable({
  providedIn: 'root',
})
export class EthContractService {
  /************************************************* Variables *************************************/
  private web3: any;
  private coinbase: '0x0000000000000000000000000000000000000000';
  private contracts_SupplyChain: any;
  private contractAddress_SupplyChain: '0x0000000000000000000000000000000000000000';

  /************************************************* Constructor ***********************************/
  constructor() {
    try {
      connect();
      if (
        typeof window.ethereum !== 'undefined' ||
        typeof window.web3 !== 'undefined'
      ) {
        this.web3 = new Web3(window['ethereum'] || window.web3.currentProvider);
      } else {
        this.web3 = new Web3(
          new Web3.providers.HttpProvider('http://ganache-cli:8545')
        );
      }
      let network;
      for (var propName in contract_SupplyChain.networks) {
        if (contract_SupplyChain.networks.hasOwnProperty(propName)) {
          network = contract_SupplyChain.networks[propName];
          break;
        }
      }
      this.contracts_SupplyChain = this.web3.eth
        .contract(contract_SupplyChain.abi)
        .at(network.address);
      this.contractAddress_SupplyChain = network.address;
      window.contracts = this.contracts_SupplyChain;
      this.getCoinbase();
    } catch (err) {
      return err;
    }
  }
  /************************************************* Basic *****************************************/
  getCoinbase = async () => {
    this.coinbase = await this.web3.eth.getCoinbase();
  };

  getAccountInfo = () => {
    return new Promise((resolve, reject) => {
      this.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          this.web3.eth.getBalance(account, function (err, balance) {
            if (err === null) {
              return resolve({
                Account: account,
                Balance: this.web3.fromWei(balance, 'ether'),
              });
            } else {
              return reject('error!');
            }
          });
        }
      });
    });
  };

  /************************************************* Admin *****************************************/
  getOwner = async () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.web3.eth.getBalance(account, function (err, balance) {
            if (err === null) {
              that.contracts_SupplyChain.Owner(function (error, ownerAddress) {
                if (!error) {
                  if (ownerAddress == account) {
                    that.contracts_SupplyChain.getUsersCount(function (
                      error,
                      userCount
                    ) {
                      if (!error) {
                        return resolve({
                          Account: account,
                          Balance: that.web3.fromWei(balance, 'ether'),
                          Role: 'Success',
                          contractAddress: that.contractAddress_SupplyChain,
                          UserCount: JSON.parse(userCount),
                        });
                      } else
                        return resolve({
                          Account: account,
                          Balance: that.web3.fromWei(balance, 'ether'),
                          Role: 'Success',
                          contractAddress: that.contractAddress_SupplyChain,
                          UserCount: 'Error',
                        });
                    });
                  } else {
                    return resolve({ Role: 'Failure' });
                  }
                } else reject(error);
              });
            } else {
              return reject('error!');
            }
          });
        } else {
          return reject('No Coinbase!');
        }
      });
    });
  };

  registerNewUser = (formData) => {
    let that = this;
    formData.Name = that.web3.padRight(that.web3.fromAscii(formData.Name), 34);
    formData.Location = that.web3.padRight(
      that.web3.fromAscii(formData.Location),
      34
    );

    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.registerUser(
            formData.EthAddress,
            formData.Name,
            formData.Location,
            formData.Role,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  /************************************************* Users *****************************************/
  getRole = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.web3.eth.getBalance(account, function (err, balance) {
            if (err === null) {
              that.contracts_SupplyChain.getUserInfo(
                account,
                {
                  from: account,
                },
                function (error, res) {
                  if (res) {
                    var jsonResponse = {
                      Name: that.web3.toAscii(res[0].replace(/0+\b/, '')),
                      Location: that.web3.toAscii(res[1].replace(/0+\b/, '')),
                      EthAddress: res[2],
                      Role: JSON.parse(res[3]),
                    };
                    return resolve({
                      Account: account,
                      Balance: that.web3.fromWei(balance, 'ether'),
                      Role: jsonResponse,
                    });
                  } else {
                    return reject(error);
                  }
                }
              );
            } else {
              return reject(err);
            }
          });
        } else {
          return reject(err);
        }
      });
    });
  };

  getUserCount = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.contracts_SupplyChain.getUsersCount(function (error, userCount) {
        if (!error) {
          return resolve({ UserCount: JSON.parse(userCount) });
        } else return reject(error);
      });
    });
  };

  getUserProfile = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.contracts_SupplyChain.getUserbyIndex(
        formData.Index,
        {
          from: that.coinbase,
        },
        function (error, userInfo) {
          if (!error) {
            var jsonResponse = {
              Name: that.web3.toAscii(userInfo[0].replace(/0+\b/, '')),
              Location: that.web3.toAscii(userInfo[1].replace(/0+\b/, '')),
              EthAddress: userInfo[2],
              Role: JSON.parse(userInfo[3]),
            };
            resolve({ result: jsonResponse });
          } else reject(error);
        }
      );
    });
  };

  getUsers = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.contracts_SupplyChain.getUserInfo(
        formData.AccountAddress,
        function (error, userInfo) {
          if (!error) {
            var jsonResponse = {
              Name: that.web3.toAscii(userInfo[0].replace(/0+\b/, '')),
              Location: that.web3.toAscii(userInfo[1].replace(/0+\b/, '')),
              EthAddress: userInfo[2],
              Role: JSON.parse(userInfo[3]),
            };
            console.log(jsonResponse);
            resolve({ result: jsonResponse });
          } else reject(error);
        }
      );
    });
  };
  /************************************************* Supplier *************************************/

  createRawPackage = (formData) => {
    let that = this;
    formData.Description = that.web3.padRight(
      that.web3.fromAscii(formData.Description),
      34
    );
    formData.FarmerName = that.web3.padRight(
      that.web3.fromAscii(formData.FarmerName),
      34
    );
    formData.Location = that.web3.padRight(
      that.web3.fromAscii(formData.Location),
      34
    );

    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.supplyRaw(formData.Description, formData.FarmerName, formData.Location, formData.Quantity, formData.Shipper, formData.Receiver, {
          that.contracts_SupplyChain.createRawPackage(
            formData.Description,
            formData.FarmerName,
            formData.Location,
            formData.Quantity,
            formData.Shipper,
            formData.Receiver,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        } else reject(err);
      });
    });
  };

  getPackageCount = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getPackagesCountS(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };

  getPackageBatchID = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getProductIdByIndex(index, {
          that.contracts_SupplyChain.getPackageIdByIndexS(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              // console.log(result);
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getPackageBatchIDDetails = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          let contracts_RawMaterials = that.web3.eth
            .contract(contract_RawMaterials.abi)
            .at(formData.BatchID);
          contracts_RawMaterials.getSuppliedRawMaterials(
            {
              from: account,
            },
            function (error, result) {
              if (!error) {
                contracts_RawMaterials.getRawMaterialsStatus(function (
                  error,
                  status
                ) {
                  if (!error) {
                    let jsonResponse = {
                      Description: that.web3.toAscii(
                        result[0].replace(/0+\b/, '')
                      ),
                      FarmerName: that.web3.toAscii(
                        result[1].replace(/0+\b/, '')
                      ),
                      FarmLocation: that.web3.toAscii(
                        result[2].replace(/0+\b/, '')
                      ),
                      Quantity: JSON.parse(result[3]),
                      UsedQuantity: JSON.parse(result[4]),
                      Shipper: result[5],
                      Receiver: result[6],
                      Supplier: result[7],
                      Status: JSON.parse(status),
                    };
                    resolve(jsonResponse);
                  } else {
                    return reject(error);
                  }
                });
              } else reject(error);
            }
          );
        }
      });
    });
  };

  getRawMaterialStatus = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      let contracts_RawMaterials = that.web3.eth
        .contract(contract_RawMaterials.abi)
        .at(formData.BatchID);
      contracts_RawMaterials.getRawMaterialsStatus(function (error, result) {
        if (!error) {
          return resolve({ Status: JSON.parse(result) });
        } else {
          return reject(error);
        }
      });
    });
  };

  /************************************************* Transporter *************************************/

  loadConsingment = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.loadConsingment(
            formData.ConsignmentID,
            formData.TransporterType,
            formData.SubContractID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  transportCount = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.transportCount(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };

  getTransportBatchIdByIndex = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getTransportBatchIdByIndex(
            formData.Index,
            {
              from: account,
            },
            function (err, result) {
              if (!err) {
                return resolve({
                  consignmentID: result[0],
                  tarnsType: JSON.parse(result[1]),
                });
              } else {
                return reject(err);
              }
            }
          );
        }
      });
    });
  };

  /************************************************* Manufacturer *************************************/

  rawPackageReceived = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.rawPackageReceived(
            formData.PackageID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getPackagesCountM = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getPackagesCountM(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };

  getPackageIDByIndexM = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getPackageIDByIndexM(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              // console.log(result);
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  // getRawPackageQunatity = (formData) => {
  //   let that = this;
  //   return new Promise((resolve, reject) => {
  //     that.web3.eth.getCoinbase(function (err, account) {
  //       if (err === null) {
  //         that.contracts_SupplyChain.getRawPackageQunatity(formData.PackageID, {
  //           from: account
  //         }, function (error, result) {
  //           // console.log(result);
  //           if (!error)
  //             resolve(result);
  //           else
  //             reject(error);
  //         })
  //       }
  //     });
  //   });
  // }

  useRawPackage = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          let contracts_RawMaterials = that.web3.eth
            .contract(contract_RawMaterials.abi)
            .at(formData.RawMaterial);
          contracts_RawMaterials.useRawPackage(
            formData.Quantity,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  manufactureMedicine = (formData) => {
    let that = this;
    console.log(formData);
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.manufacturMedicine(
            formData.Description,
            formData.RawMaterial,
            formData.Quantity,
            formData.UsedQuantity,
            formData.Shipper,
            formData.Receiver,
            formData.ReceiverType,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
  getBatchesCountM = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getCountOfProducts({
          that.contracts_SupplyChain.getBatchesCountM(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };

  getBatchIdByIndexM = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getBatchIdByIndexM(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getMedicineBatchIDDetails = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          let contracts_Medicine = that.web3.eth
            .contract(contract_Medicine.abi)
            .at(formData.BatchID);
          contracts_Medicine.getMedicineInfo(
            {
              from: account,
            },
            function (error, result) {
              if (!error) {
                contracts_Medicine.getWDP(function (error, WDP) {
                  if (!error) {
                    contracts_Medicine.getBatchIDStatus(function (
                      error,
                      status
                    ) {
                      if (!error) {
                        let jsonResponse = {
                          Manufacturer: result[0],
                          Description: that.web3.toAscii(
                            result[1].replace(/0+\b/, '')
                          ),
                          RawMaterial: result[2],
                          Quantity: JSON.parse(result[3]),
                          Shipper: result[4],
                          Status: JSON.parse(status),
                          Wholesaler: WDP[0],
                          Distributer: WDP[1],
                          Pharma: WDP[2],
                        };
                        resolve(jsonResponse);
                      } else {
                        return reject(error);
                      }
                    });
                  } else {
                    let jsonResponse = {
                      Manufacturer: result[0],
                      Description: that.web3.toAscii(
                        result[1].replace(/0+\b/, '')
                      ),
                      RawMaterial: that.web3.toAscii(
                        result[2].replace(/0+\b/, '')
                      ),
                      Quantity: JSON.parse(result[3]),
                      Shipper: result[4],
                      Status: JSON.parse(status),
                    };
                    resolve(jsonResponse);
                  }
                });
              } else reject(error);
            }
          );
        }
      });
    });
  };

  getMedicineStatus = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      let contracts_Medicine = that.web3.eth
        .contract(contract_Medicine.abi)
        .at(formData.BatchID);
      contracts_Medicine.getBatchIDStatus(function (error, result) {
        if (!error) {
          return resolve({ Status: JSON.parse(result) });
        } else {
          return reject(error);
        }
      });
    });
  };

  getMedicineWDP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      let contracts_Medicine = that.web3.eth
        .contract(contract_Medicine.abi)
        .at(formData.BatchID);
      contracts_Medicine.getWDP(function (error, WDP) {
        if (!error) {
          let jsonResponse = {
            Wholesaler: WDP[0],
            Distributer: WDP[1],
            Pharma: WDP[2],
          };
          return resolve(jsonResponse);
        } else {
          return reject(error);
        }
      });
    });
  };

  /************************************************* Wholesaler *************************************/
  medicineReceived = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.medicineReceived(
            formData.PackageID,
            formData.SubContractID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getBatchIdByIndexW = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getBatchIdByIndexW(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  transferMedicineWtoD = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.transferMedicineWtoD(
            formData.BatchID,
            formData.Shipper,
            formData.Receiver,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getBatchesCountWD = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getCountOfProducts({
          that.contracts_SupplyChain.getBatchesCountWD(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };
  getBatchesCountW = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getCountOfProducts({
          that.contracts_SupplyChain.getBatchesCountW(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };
  getBatchIdByIndexWD = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getBatchIdByIndexWD(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              // console.log(result);
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
  getSubContractWD = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getSubContractWD(
            formData.BatchID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getSubContractStatusWD = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      let contracts_MedicineW_D = that.web3.eth
        .contract(contract_MedicineW_D.abi)
        .at(formData.BatchID);
      contracts_MedicineW_D.getBatchIDStatus(function (error, result) {
        if (!error) {
          return resolve({ Status: JSON.parse(result) });
        } else {
          return reject(error);
        }
      });
    });
  };

  /************************************************* Distributer *************************************/

  transferMedicineDtoP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.transferMedicineDtoP(
            formData.BatchID,
            formData.Shipper,
            formData.Receiver,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getBatchesCountDP = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getCountOfProducts({
          that.contracts_SupplyChain.getBatchesCountDP(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };
  getBatchIdByIndexDP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getBatchIdByIndexDP(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              // console.log(result);
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
  getSubContractDP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getSubContractDP(
            formData.BatchID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getSubContractStatusDP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      let contracts_MedicineD_P = that.web3.eth
        .contract(contract_MedicineD_P.abi)
        .at(formData.BatchID);
      contracts_MedicineD_P.getBatchIDStatus(function (error, result) {
        if (!error) {
          return resolve({ Status: JSON.parse(result) });
        } else {
          return reject(error);
        }
      });
    });
  };

  /************************************************* Pharma *************************************/
  MedicineRecievedAtPharma = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.MedicineRecievedAtPharma(
            formData.PackageID,
            formData.SubContractID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
  updateSaleStatus = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.updateSaleStatus(
            formData.BatchID,
            formData.Status,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
  salesInfo = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.salesInfo(
            formData.BatchID,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };

  getBatchesCountP = () => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          // that.contracts_SupplyChain.getCountOfProducts({
          that.contracts_SupplyChain.getBatchesCountP(
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(JSON.parse(result));
              else reject(error);
            }
          );
        }
      });
    });
  };
  getBatchIdByIndexP = (formData) => {
    let that = this;
    return new Promise((resolve, reject) => {
      that.web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
          that.contracts_SupplyChain.getBatchIdByIndexP(
            formData.Index,
            {
              from: account,
            },
            function (error, result) {
              if (!error) resolve(result);
              else reject(error);
            }
          );
        }
      });
    });
  };
}
