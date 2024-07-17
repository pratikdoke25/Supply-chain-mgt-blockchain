pragma solidity >=0.4.25 <0.6.0;

import './Medicine.sol';

/********************************************** MedicineD_P ******************************************/
/// @title MedicineD_P
/// @notice
/// @dev Sub Contract for Medicine Transaction between Distributer and Pharma
contract MedicineD_P {
    /// @notice
    address Owner;

    enum packageStatus { atcreator, picked, delivered}

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
    /// @param Sender Distributer Ethereum Network Address
    /// @param Shipper Transporter Ethereum Network Address
    /// @param Receiver Pharma Ethereum Network Address
    constructor(
        address BatchID,
        address Sender,
        address Shipper,
        address Receiver
    ) public {
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
    function pickDP(
        address BatchID,
        address Shipper
    ) public {
        require(
            Shipper == shipper,
            "Only Associated shipper can call this function."
        );
        status = packageStatus(1);

        Medicine(BatchID).sendDP(
            receiver,
            sender
        );
    }

    /// @notice
    /// @dev Recieved Medicine Batch by Associate Distributer
    /// @param BatchID Medicine BatchID
    /// @param Receiver Pharma Ethereum Network Address
    function recieveDP(
        address BatchID,
        address Receiver
    ) public {
        require(
            Receiver == receiver,
            "Only Associated receiver can call this function."
        );
        status = packageStatus(2);

        Medicine(BatchID).recievedDP(
            Receiver
        );
    }

    /// @notice
    /// @dev Get Medicine Batch Transaction status in between Distributer and Pharma
    /// @return Transaction status
    function getBatchIDStatus() public view returns(
        uint
    ) {
        return uint(status);
    }

}
