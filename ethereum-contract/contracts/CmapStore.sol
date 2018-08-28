pragma solidity ^0.4.24;

import "./CmapOwner.sol";

contract CmapStore is CmapOwner {

    struct StateStruct {
        mapping(bytes32 => bytes32) sub_state;
    }

    struct ObjectStruct {
        mapping(bytes32 => bytes32) params;
        bytes32 key; 
        bool isObject;
    }

    mapping(string => ObjectStruct) store;

    constructor() public {
    }

}