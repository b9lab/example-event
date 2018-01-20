pragma solidity ^0.4.10;

contract Sink {

    event LogSunk(address indexed fool, uint amount);

    function() public payable {
        LogSunk(msg.sender, msg.value);
    }
}