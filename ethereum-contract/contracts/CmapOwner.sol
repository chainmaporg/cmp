pragma solidity ^0.4.24;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract CmapOwner {
    mapping(address => uint) owners;


    event NewOwnerAdded(address indexed newOwner,address indexed by);
    event OwnerRemoved(address indexed removed, address indexed by);

    /**
    * create first owner
    */
    constructor() public {
        owners[msg.sender] = 1;
        
    }

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(owners[msg.sender] == 1,"Only owner can make this action");
        _;
    }

    /**
    * add a new owner
    */
    function addOwner(address newOwner) public onlyOwner returns (bool){
        require(owners[newOwner] == 0,"User is already a owner");
        owners[newOwner] = 1;
        emit NewOwnerAdded(newOwner,msg.sender);
        return true;
    }

    /**
    * remove owner
    */
    function removeOwner(address deletedOwner) public onlyOwner returns (bool){
        require(deletedOwner != msg.sender,"Owner cant remove self");
        owners[deletedOwner] = 0;
        emit OwnerRemoved(deletedOwner,msg.sender);
        return true;      
    }

    /**
    * remove owner
    */
    function isOwner(address testAddress) public view returns (bool){
        return owners[testAddress] == uint(1);
    }



}