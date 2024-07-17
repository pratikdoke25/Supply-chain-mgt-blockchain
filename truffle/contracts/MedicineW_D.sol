pragma solidity >=0.4.25 <0.6.0;

import './Medicine.sol';

/********************************************** MedicineW_D ******************************************/
/// @title MedicineW_D
/// @notice
/// @dev Sub Contract for Medicine Transaction between Wholesaler and Distributer
contract MedicineW_D {
    /// @notice
    address Owner;

    enum packageStatus { atWholesaler, picked, delivered }

    /// @notice
    address batchid;
    /// @notice
    address sender;
    /// @notice
    address shipper;
    /// @notice
    address receiver;
    /// @notice
    packageStatus status;

    /// @notice
    /// @dev Create SubContract for Medicine Transaction
    /// @param BatchID Medicine BatchID
    /// @param Sender Wholesaler Ethereum Network Address
    /// @param Shipper Transporter Ethereum Network Address
    /// @param Receiver Distributer Ethereum Network Address
    constructor(address BatchID, address Sender, address Shipper, address Receiver) public {
        Owner = Sender;
        batchid = BatchID;
        sender = Sender;
        shipper = Shipper;
        receiver = Receiver;
        status = packageStatus(0);
    }

    /// @notice
    /// @dev Pick Medicine Batch by Associated Transporter
    /// @param BatchID Medicine BatchID
    /// @param Shipper Transporter Ethereum Network Address
    function pickWD(address BatchID, address Shipper) public {
        require(Shipper == shipper, "Only Associated shipper can call this function.");
        status = packageStatus(1);
        Medicine(BatchID).sendWD(receiver,sender);
    }

    /// @notice
    /// @dev Recieved Medicine Batch by Associate Distributer
    /// @param BatchID Medicine BatchID
    /// @param Receiver Distributer Ethereum Network Address
    function recieveWD(address BatchID,address Receiver) public {
        require(Receiver == receiver, "Only Associated receiver can call this function.");
        status = packageStatus(2);
        Medicine(BatchID).recievedWD(Receiver);
    }

    /// @notice
    /// @dev Get Medicine Batch Transaction status in between Wholesaler and Distributer
    /// @return Transaction status
    function getBatchIDStatus() public view returns(uint) {
        return uint(status);
    }
}
