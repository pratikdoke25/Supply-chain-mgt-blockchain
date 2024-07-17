pragma solidity >=0.4.25 <0.6.0;

import "./RawMaterials.sol";
import "./Medicine.sol";
import "./MedicineW_D.sol";
import "./MedicineD_P.sol";

/// @title Blockchain : Pharmaceutical SupplyChain
/// @author Yash Gupta
contract SupplyChain {
    address public Owner;
    struct UserInfo {
        bytes32 name;
        bytes32 location;
        address ethAddress;
        roles role;
    }
    mapping(address => UserInfo) UsersDetails;
    address[] users;
    mapping(address => address[]) supplierRawProductInfo;
    mapping(address => address[]) transporterConsignmentInfo;
    mapping(address => uint256) consignmentTransporterType;
    mapping(address => address[]) RawPackagesAtManufacturer;
    mapping(address => address[]) ManufactureredMedicineBatches;
    mapping(address => address[]) MedicineBatchesAtWholesaler;
    mapping(address => address[]) MedicineWtoD;
    mapping(address => address) MedicineWtoDTxContract;
    mapping(address => address[]) MedicineBatchAtDistributer;
    mapping(address => address[]) MedicineDtoP;
    mapping(address => address) MedicineDtoPTxContract;
    mapping(address => address[]) MedicineBatchAtPharma;
    mapping(address => salestatus) sale;

    /// @notice
    /// @dev Initiate SupplyChain Contract
    constructor() public {
        Owner = msg.sender;
    }

    /********************************************** Owner Section *********************************************/

    /// @dev Validate Owner
    modifier onlyOwner() {
        require(msg.sender == Owner, "Only owner can call this function.");
        _;
    }

    enum roles {
        norole,
        supplier,
        transporter,
        manufacturer,
        wholesaler,
        distributer,
        pharma,
        revoke
    }
    enum salestatus {
        notfound,
        atpharma,
        sold,
        expire,
        damaged
    }

    event UserRegister(address indexed EthAddress, bytes32 Name);
    event UserRoleRevoked(
        address indexed EthAddress,
        bytes32 Name,
        uint256 Role
    );
    event UserRoleRessigne(
        address indexed EthAddress,
        bytes32 Name,
        uint256 Role
    );
    event RawSupplyInit(
        address indexed ProductID,
        address indexed Supplier,
        address Shipper,
        address indexed Receiver
    );
    event MedicineNewBatch(
        address indexed BatchId,
        address indexed Manufacturer,
        address shipper,
        address indexed Receiver
    );
    event MedicineStatus(
        address BatchID,
        address indexed Pharma,
        uint256 status
    );

    /// @notice
    /// @dev Register New user by Owner
    /// @param EthAddress Ethereum Network Address of User
    /// @param Name User name
    /// @param Location User Location
    /// @param Role User Role
    function registerUser(
        address EthAddress,
        bytes32 Name,
        bytes32 Location,
        uint256 Role
    ) public onlyOwner {
        require(
            UsersDetails[EthAddress].role == roles.norole,
            "User Already registered"
        );
        UsersDetails[EthAddress].name = Name;
        UsersDetails[EthAddress].location = Location;
        UsersDetails[EthAddress].ethAddress = EthAddress;
        UsersDetails[EthAddress].role = roles(Role);
        users.push(EthAddress);
        emit UserRegister(EthAddress, Name);
    }

    /// @notice
    /// @dev Revoke users role
    /// @param userAddress User Ethereum Network Address
    function revokeRole(address userAddress) public onlyOwner {
        require(
            UsersDetails[userAddress].role != roles.norole,
            "User not registered"
        );
        emit UserRoleRevoked(
            userAddress,
            UsersDetails[userAddress].name,
            uint256(UsersDetails[userAddress].role)
        );
        UsersDetails[userAddress].role = roles(7);
    }

    /// @notice
    /// @dev Reassigne new role to User
    /// @param userAddress User Ethereum Network Address
    /// @param Role Role to assigne
    function reassigneRole(address userAddress, uint256 Role) public onlyOwner {
        require(
            UsersDetails[userAddress].role != roles.norole,
            "User not registered"
        );
        UsersDetails[userAddress].role = roles(Role);
        emit UserRoleRessigne(
            userAddress,
            UsersDetails[userAddress].name,
            uint256(UsersDetails[userAddress].role)
        );
    }

    /********************************************** User Section **********************************************/

    /// @notice
    /// @dev Get User Information/ Profile
    /// @param User User Ethereum Network Address
    /// @return User Details
    function getUserInfo(address User)
        public
        view
        returns (
            bytes32 name,
            bytes32 location,
            address ethAddress,
            roles role
        )
    {
        return (
            UsersDetails[User].name,
            UsersDetails[User].location,
            UsersDetails[User].ethAddress,
            UsersDetails[User].role
        );
    }

    /// @notice
    /// @dev Get Number of registered Users
    /// @return Number of registered Users
    function getUsersCount() public view returns (uint256 count) {
        return users.length;
    }

    /// @notice
    /// @dev Get User by Index value of stored data
    /// @param index Indexed Number
    /// @return User Details
    function getUserbyIndex(uint256 index)
        public
        view
        returns (
            bytes32 name,
            bytes32 location,
            address ethAddress,
            roles role
        )
    {
        return getUserInfo(users[index]);
    }

    /********************************************** Supplier Section ******************************************/

    /// @notice
    /// @dev Create new raw package by Supplier
    /// @param Des Transporter Ethereum Network Address
    /// @param Rcvr Manufacturer Ethereum Network Address
    function createRawPackage(
        bytes32 Des,
        bytes32 FN,
        bytes32 Loc,
        uint256 Quant,
        address Shpr,
        address Rcvr
    ) public {
        require(
            UsersDetails[msg.sender].role == roles.supplier,
            "Only Supplier Can call this function "
        );
        RawMaterials rawData = new RawMaterials(
            msg.sender,
            Des,
            FN,
            Loc,
            Quant,
            Shpr,
            Rcvr
        );
        supplierRawProductInfo[msg.sender].push(address(rawData));
        transporterConsignmentInfo[Shpr].push(address(rawData));
        consignmentTransporterType[address(rawData)] = 1;
        emit RawSupplyInit(address(rawData), msg.sender, Shpr, Rcvr);
    }

    /// @notice
    /// @dev  Get Count of created package by supplier(caller)
    /// @return Number of packages
    function getPackagesCountS() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.supplier,
            "Only Supplier Can call this function"
        );
        return supplierRawProductInfo[msg.sender].length;
    }

    /// @notice
    /// @dev Get PackageID by Indexed value of stored data
    /// @param index Indexed Value
    /// @return PackageID
    function getPackageIdByIndexS(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.supplier,
            "Only Supplier Can call this function"
        );
        return supplierRawProductInfo[msg.sender][index];
    }

    /********************************************** Transporter Section ******************************************/

    /// @notice
    /// @dev Load Consingment fot transport one location to another.
    /// @param pid PackageID or MedicineID
    /// @param transportertype Transporter Type on the basic of tx between Roles
    /// @param cid Sub Contract ID for Consingment transaction
    function loadConsingment(
        address pid,
        uint256 transportertype,
        address cid
    ) public {
        require(
            UsersDetails[msg.sender].role == roles.transporter,
            "Only Transporter can call this function"
        );
        require(transportertype > 0, "Transporter Type must be define");
        if (transportertype == 1) {
            // Supplier to Manufacturer
            RawMaterials(pid).pickPackage(msg.sender);
        } else if (transportertype == 2) {
            // Manufacturer to Wholesaler OR Manufacturer to Distributer
            Medicine(pid).pickPackage(msg.sender);
        } else if (transportertype == 3) {
            // Wholesaler to Distributer
            MedicineW_D(cid).pickWD(pid, msg.sender);
            consignmentTransporterType[cid] = transportertype;
        } else if (transportertype == 4) {
            // Distrubuter to Pharma
            MedicineD_P(cid).pickDP(pid, msg.sender);
        }
    }

    /// @notice
    /// @dev Get Count of Consingment of transporter(Caller)
    /// @return Number of Consingment
    function transportCount() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.transporter,
            "Only Transporter Can call this function"
        );
        return transporterConsignmentInfo[msg.sender].length;
    }

    /// @notice
    /// @dev Get TransportBatchID by Indexed value of stored data
    /// @param index Indexed Value
    /// @return PackageID
    function getTransportBatchIdByIndex(uint256 index)
        public
        view
        returns (address packageID, uint256 transportertype)
    {
        require(
            UsersDetails[msg.sender].role == roles.transporter,
            "Only Supplier Can call this function"
        );
        return (
            transporterConsignmentInfo[msg.sender][index],
            consignmentTransporterType[
                transporterConsignmentInfo[msg.sender][index]
            ]
        );
    }

    /********************************************** Manufacturer Section ******************************************/

    /// @notice
    /// @dev Update Package / Medicine batch recieved status by ethier Manufacturer or Distributer
    /// @param pid  PackageID or MedicineID
    function rawPackageReceived(address pid) public {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only manufacturer can call this function"
        );
        RawMaterials(pid).receivedPackage(msg.sender);
        RawPackagesAtManufacturer[msg.sender].push(pid);
    }

    /// @notice
    /// @dev Get Package Count at Manufacturer
    /// @return Number of Packages at Manufacturer
    function getPackagesCountM() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only manufacturer can call this function"
        );
        return RawPackagesAtManufacturer[msg.sender].length;
    }

    /// @notice
    /// @dev Get PackageID by Indexed value of stored data
    /// @param index Indexed Value
    /// @return PackageID
    function getPackageIDByIndexM(uint256 index)
        public
        view
        returns (address BatchID)
    {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only manufacturer can call this function"
        );
        return RawPackagesAtManufacturer[msg.sender][index];
    }

    /// @notice
    /// @dev Create Medicine Batch
    /// @param Des Description of Medicine batch
    /// @param RM RawMaterials Information
    /// @param Quant Number of Units
    /// @param Shpr Transporter Ethereum Network Address
    /// @param Rcvr Receiver Ethereum Network Address
    /// @param RcvrType Receiver Type Either Wholesaler(1) or Distributer(2)
    function manufacturMedicine(
        bytes32 Des,
        address RM,
        uint256 Quant,
        uint256 usedQuant,
        address Shpr,
        address Rcvr,
        uint256 RcvrType
    ) public {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only manufacturer can call this function"
        );
        require(RcvrType != 0, "Receiver Type must be define");
        Medicine m = new Medicine(
            msg.sender,
            Des,
            RM,
            Quant,
            Shpr,
            Rcvr,
            RcvrType
        );
        RawMaterials(RM).useRawPackage(msg.sender, usedQuant);
        ManufactureredMedicineBatches[msg.sender].push(address(m));
        transporterConsignmentInfo[Shpr].push(address(m));
        consignmentTransporterType[address(m)] = 2;
        emit MedicineNewBatch(address(m), msg.sender, Shpr, Rcvr);
    }

    /// @notice
    /// @dev Get Medicine Batch Count
    /// @return Number of Batches
    function getBatchesCountM() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only Manufacturer Can call this function."
        );
        return ManufactureredMedicineBatches[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Indexed Number
    /// @return Medicine BatchID
    function getBatchIdByIndexM(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.manufacturer,
            "Only Manufacturer Can call this function."
        );
        return ManufactureredMedicineBatches[msg.sender][index];
    }

    /********************************************** Wholesaler Section ******************************************/

    /// @notice
    /// @dev Medicine Batch Received
    /// @param batchid Medicine BatchID
    /// @param cid Sub Contract ID for Medicine (if transaction Wholesaler to Distributer)
    function medicineReceived(address batchid, address cid) public {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler ||
                UsersDetails[msg.sender].role == roles.distributer,
            "Only Wholesaler and Distributer can call this function"
        );

        uint256 rtype = Medicine(batchid).receivedPackage(msg.sender);
        if (rtype == 1) {
            MedicineBatchesAtWholesaler[msg.sender].push(batchid);
        } else if (rtype == 2) {
            MedicineBatchAtDistributer[msg.sender].push(batchid);
            if (Medicine(batchid).getWDP()[0] != address(0)) {
                MedicineW_D(cid).recieveWD(batchid, msg.sender);
            }
        }
    }

    /// @notice
    /// @dev Get Medicine Batch Count
    /// @return Number of Batches
    function getBatchesCountW() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler,
            "Only wholesaler Can call this function."
        );
        return MedicineBatchesAtWholesaler[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Indexed Number
    /// @return Medicine BatchID
    function getBatchIdByIndexW(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler,
            "Only wholesaler Can call this function."
        );
        return MedicineBatchesAtWholesaler[msg.sender][index];
    }

    /// @notice
    /// @dev Sub Contract for Medicine Transfer from Wholesaler to Distributer
    /// @param BatchID Medicine BatchID
    /// @param Shipper Transporter Ethereum Network Address
    /// @param Receiver Distributer Ethereum Network Address
    function transferMedicineWtoD(
        address BatchID,
        address Shipper,
        address Receiver
    ) public {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler &&
                msg.sender == Medicine(BatchID).getWDP()[0],
            "Only Wholesaler or current owner of package can call this function"
        );
        MedicineW_D wd = new MedicineW_D(
            BatchID,
            msg.sender,
            Shipper,
            Receiver
        );
        MedicineWtoD[msg.sender].push(address(wd));
        MedicineWtoDTxContract[BatchID] = address(wd);
        transporterConsignmentInfo[Shipper].push(address(wd));
        consignmentTransporterType[address(wd)] = 3;
    }

    /// @notice
    /// @dev Get Medicine Batch Count
    /// @return Number of Batches
    function getBatchesCountWD() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler,
            "Only Wholesaler Can call this function."
        );
        return MedicineWtoD[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Indexed Number
    /// @return Medicine BatchID
    function getBatchIdByIndexWD(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.wholesaler,
            "Only Wholesaler Can call this function."
        );
        return MedicineWtoD[msg.sender][index];
    }

    /// @notice
    /// @dev Get Sub Contract ID of Medicine Batch Transfer in between Wholesaler to Distributer
    /// @param BatchID Medicine BatchID
    /// @return SubContract ID
    function getSubContractWD(address BatchID)
        public
        view
        returns (address SubContractWD)
    {
        // require(
        //     UsersDetails[msg.sender].role == roles.wholesaler,
        //     "Only Wholesaler Can call this function."
        // );
        return MedicineWtoDTxContract[BatchID];
    }

    /********************************************** Distributer Section ******************************************/

    /// @notice
    /// @dev Get Medicine Batch Count
    /// @return Number of Batches
    function getBatchesCountD() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.distributer,
            "Only Distributer Can call this function."
        );
        return MedicineBatchAtDistributer[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Indexed Number
    /// @return Medicine BatchID
    function getBatchIdByIndexD(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.distributer,
            "Only Distributer Can call this function."
        );
        return MedicineBatchAtDistributer[msg.sender][index];
    }

    /// @notice
    /// @dev Transfer Medicine BatchID in between Distributer to Pharma
    /// @param BatchID Medicine BatchID
    /// @param Shipper Transporter Ethereum Network Address
    /// @param Receiver Pharma Ethereum Network Address
    function transferMedicineDtoP(
        address BatchID,
        address Shipper,
        address Receiver
    ) public {
        require(
            UsersDetails[msg.sender].role == roles.distributer &&
                msg.sender == Medicine(BatchID).getWDP()[1],
            "Only Distributer or current owner of package can call this function"
        );
        MedicineD_P dp = new MedicineD_P(
            BatchID,
            msg.sender,
            Shipper,
            Receiver
        );
        MedicineDtoP[msg.sender].push(address(dp));
        MedicineDtoPTxContract[BatchID] = address(dp);
        transporterConsignmentInfo[Shipper].push(address(dp));
        consignmentTransporterType[address(dp)] = 4;
    }

    /// @notice
    /// @dev Get Medicine BatchID Count
    /// @return Number of Batches
    function getBatchesCountDP() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.distributer,
            "Only Distributer Can call this function."
        );
        return MedicineDtoP[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Index Number
    /// @return Medicine BatchID
    function getBatchIdByIndexDP(uint256 index)
        public
        view
        returns (address packageID)
    {
        require(
            UsersDetails[msg.sender].role == roles.distributer,
            "Only Distributer Can call this function."
        );
        return MedicineDtoP[msg.sender][index];
    }

    /// @notice
    /// @dev Get SubContract ID of Medicine Batch Transfer in between Distributer to Pharma
    /// @param BatchID Medicine BatchID
    /// @return SubContract ID
    function getSubContractDP(address BatchID)
        public
        view
        returns (address SubContractDP)
    {
        // require(
        //     UsersDetails[msg.sender].role == roles.distributer,
        //     "Only Distributer Can call this function."
        // );
        return MedicineDtoPTxContract[BatchID];
    }

    /********************************************** Pharma Section ******************************************/

    /// @notice
    /// @dev Medicine Batch Recieved
    /// @param batchid Medicine BatchID
    /// @param cid SubContract ID
    function MedicineRecievedAtPharma(address batchid, address cid) public {
        require(
            UsersDetails[msg.sender].role == roles.pharma,
            "Only Pharma Can call this function."
        );
        MedicineD_P(cid).recieveDP(batchid, msg.sender);
        MedicineBatchAtPharma[msg.sender].push(batchid);
        sale[batchid] = salestatus(1);
    }

    /// @notice
    /// @dev Update Medicine Batch status
    /// @param BatchID Medicine BatchID
    /// @param Status Medicine Batch Status ( sold, expire etc.)
    function updateSaleStatus(address BatchID, uint256 Status) public {
        require(
            UsersDetails[msg.sender].role == roles.pharma &&
                msg.sender == Medicine(BatchID).getWDP()[2],
            "Only Pharma or current owner of package can call this function"
        );

        require(sale[BatchID] == salestatus(1), "Medicine Must be at Pharma");
        sale[BatchID] = salestatus(Status);
        emit MedicineStatus(BatchID, msg.sender, Status);
    }

    /// @notice
    /// @dev Get Medicine Batch status
    /// @param BatchID Medicine BatchID
    /// @return Status
    function salesInfo(address BatchID) public view returns (uint256 Status) {
        return uint256(sale[BatchID]);
    }

    /// @notice
    /// @dev Get Medicine Batch count
    /// @return Number of Batches
    function getBatchesCountP() public view returns (uint256 count) {
        require(
            UsersDetails[msg.sender].role == roles.pharma,
            "Only Wholesaler or current owner of package can call this function"
        );
        return MedicineBatchAtPharma[msg.sender].length;
    }

    /// @notice
    /// @dev Get Medicine BatchID by indexed value of stored data
    /// @param index Index Number
    /// @return Medicine BatchID
    function getBatchIdByIndexP(uint256 index)
        public
        view
        returns (address BatchID)
    {
        require(
            UsersDetails[msg.sender].role == roles.pharma,
            "Only Wholesaler or current owner of package can call this function"
        );
        return MedicineBatchAtPharma[msg.sender][index];
    }
}
