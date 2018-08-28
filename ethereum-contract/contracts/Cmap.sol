pragma solidity ^0.4.24;

import "./CmapOwner.sol";
import "./CmapToken.sol";

contract Cmap is CmapOwner {

    address private _tokenAddress;


    constructor() public {

    }

    function setTokenAddress(address token) public onlyOwner{
        _tokenAddress = token;
    }

    function tokenDeposit(address user,uint256 value) public onlyOwner{
        CmapToken token = CmapToken(_tokenAddress);
        token.poolDeposit(user,value);
    }

    function balanceOf(address user) public view returns (uint256){
        CmapToken token = CmapToken(_tokenAddress);
        return token.balanceOf(user);
    }




}