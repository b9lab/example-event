pragma solidity ^0.4.10;

contract Fool {

    event LogFooled(address indexed fool, address indexed sink, uint amount);

    function sinkIt(address sink) public payable {
        LogFooled(msg.sender, sink, msg.value);
        sink.transfer(msg.value);
    }
}