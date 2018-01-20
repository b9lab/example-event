pragma solidity ^0.4.10;

contract Owned {
	address public owner;

	// Notice how newOwner is not indexed
	event OnOwnerChanged(address indexed previousOwner, address newOwner);

	function Owned() {
		owner = msg.sender;
	}

	modifier fromOwner {
		require(msg.sender == owner);
		_;
	}

	function setOwner(address newOwner) fromOwner {
		// Call the event
		OnOwnerChanged(owner, newOwner);
		owner = newOwner;
	}
}