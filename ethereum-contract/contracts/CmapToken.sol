pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "./CmapOwner.sol";

contract CmapToken is StandardToken, CmapOwner {
    string public symbol = "CMAP";
    string public name = "ChainMap Token";
    uint8 public decimals = 4;
    uint256 public _totalSupply = 2000000000*10000;
    uint256 public _poolToken;

    constructor() public {
        balances[msg.sender] = _totalSupply.div(2);
        _poolToken = _totalSupply.div(2);
    }

    function poolDeposit(address to, uint256 value) public onlyOwner returns (uint256){
        require(_poolToken >= value,"There isnt enough token for deposit");
        balances[to] = balances[to].add(value);
        _poolToken = _poolToken.sub(value);
        return balances[to];
    }




}