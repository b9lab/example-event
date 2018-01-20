pragma solidity ^0.4.6;

contract Incrementor {
    uint innerValue;

    event LogValue(uint value);

    function Incrementor() {
        LogValue(0);
    }

    function increaseValue() {
        LogValue(++innerValue);
    }
}