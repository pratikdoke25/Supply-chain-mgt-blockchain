pragma solidity >=0.4.25 <0.6.0;

/********************************************** Medicine ******************************************/
// @title Medicine
// @notice
// @dev
contract Medicine {
    /// @notice
    address Owner;

    enum MedicineStatus {
        atcreator,
        picked4W,
        picked4D,
        deliveredatW,
        deliveredatD,
        picked4P,
        deliveredatP
    }

    // address batchid;
    bytes32 description;
    /// @notice
    address rawmateriales;
    /// @notice
    uint256 quantity;
    /// @notice
    address shipper;
    /// @notice
    address manufacturer;
    /// @notice
    address wholesaler;
    /// @notice
    address distributer;
    /// @notice
    address pharma;
    /// @notice
    MedicineStatus status;

    event ShippmentUpdate(
        address indexed BatchID,
        address indexed Shipper,
        address indexed Receiver,
        uint256 TransporterType,
        uint256 Status
    );

    /// @notice
    /// @dev Create new Medicine Batch by Manufacturer
    /// @param Manu Manufacturer Ethereum Network Address
    /// @param Des Description of Medicine Batch
    /// @param RM RawMatrials for Medicine
    /// @param Quant Number of units
    /// @param Shpr Transporter Ethereum Network Address
    /// @param Rcvr Receiver Ethereum Network Address
    /// @param RcvrType Receiver Type either Wholesaler(1) or Distributer(2)
    constructor(
        address Manu,
        bytes32 Des,
        address RM,
        uint256 Quant,
        address Shpr,
        address Rcvr,
        uint256 RcvrType
    ) public {
        Owner = Manu;
        manufacturer = Manu;
        description = Des;
        rawmateriales = RM;
        quantity = Quant;
        shipper = Shpr;
        if (RcvrType == 1) {
            wholesaler = Rcvr;
        } else if (RcvrType == 2) {
            distributer = Rcvr;
        }
    }

    /// @notice
    /// @dev Get Medicine Batch basic Details
    /// @return Medicine Batch Details
    function getMedicineInfo()
        public
        view
        returns (
            address Manu,
            bytes32 Des,
            address RM,
            uint256 Quant,
            address Shpr
        )
    {
        return (manufacturer, description, rawmateriales, quantity, shipper);
    }

    /// @notice
    /// @dev Get address Wholesaler, Distributer and Pharma
    /// @return Address Array
    function getWDP() public view returns (address[3] memory WDP) {
        return ([wholesaler, distributer, pharma]);
    }

    /// @notice
    /// @dev Get Medicine Batch Transaction Status
    /// @return Medicine Transaction Status
    function getBatchIDStatus() public view returns (uint256) {
        return uint256(status);
    }

    /// @notice
    /// @dev Pick Medicine Batch by Associate Transporter
    /// @param shpr Transporter Ethereum Network Address
    function pickPackage(address shpr) public {
        require(
            shpr == shipper,
            "Only Associate Shipper can call this function"
        );
        require(status == MedicineStatus(0), "Package must be at Supplier.");

        if (wholesaler != address(0x0)) {
            status = MedicineStatus(1);
            emit ShippmentUpdate(address(this), shipper, wholesaler, 1, 1);
        } else {
            status = MedicineStatus(2);
            emit ShippmentUpdate(address(this), shipper, distributer, 1, 1);
        }
    }

    /// @notice
    /// @dev Received Medicine Batch by Associated Wholesaler or Distributer
    /// @param Rcvr Wholesaler or Distributer
    function receivedPackage(address Rcvr) public returns (uint256 rcvtype) {
        require(
            Rcvr == wholesaler || Rcvr == distributer,
            "Only Associate Wholesaler or Distrubuter can call this function"
        );
        require(uint256(status) >= 1, "Product not picked up yet");

        if (Rcvr == wholesaler && status == MedicineStatus(1)) {
            status = MedicineStatus(3);
            emit ShippmentUpdate(address(this), shipper, wholesaler, 2, 3);
            return 1;
        } else if (Rcvr == distributer && status == MedicineStatus(2)) {
            status = MedicineStatus(4);
            emit ShippmentUpdate(address(this), shipper, distributer, 3, 4);
            return 2;
        }
    }

    /// @notice
    /// @dev Update Medicine Batch transaction Status(Pick) in between Wholesaler and Distributer
    /// @param receiver Distributer Ethereum Network Address
    /// @param sender Wholesaler Ethereum Network Address
    function sendWD(address receiver, address sender) public {
        require(wholesaler == sender, "this Wholesaler is not Associated.");
        distributer = receiver;
        status = MedicineStatus(2);
    }

    /// @notice
    /// @dev Update Medicine Batch transaction Status(Recieved) in between Wholesaler and Distributer
    /// @param receiver Distributer
    function recievedWD(address receiver) public {
        require(distributer == receiver, "This Distributer is not Associated.");
        status = MedicineStatus(4);
    }

    /// @notice
    /// @dev Update Medicine Batch transaction Status(Pick) in between Distributer and Pharma
    /// @param receiver Pharma Ethereum Network Address
    /// @param sender Distributer Ethereum Network Address
    function sendDP(address receiver, address sender) public {
        require(distributer == sender, "This Distributer is not Associated.");
        pharma = receiver;
        status = MedicineStatus(5);
    }

    /// @notice
    /// @dev Update Medicine Batch transaction Status(Recieved) in between Distributer and Pharma
    /// @param receiver Pharma Ethereum Network Address
    function recievedDP(address receiver) public {
        require(pharma == receiver, "This Pharma is not Associated.");
        status = MedicineStatus(6);
    }
}
