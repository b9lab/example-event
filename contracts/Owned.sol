contract Owned {
	address public owner;

	// Notice how newOwner is not indexed
	event OnOwnerChanged(address indexed previousOwner, address newOwner);

	function Owned() {
		owner = msg.sender;
	}

	modifier fromOwner {
		if (msg.sender != owner) throw;
		_
	}

	function setOwner(address newOwner) fromOwner {
		// Call the event
		OnOwnerChanged(owner, newOwner);
		owner = newOwner;
	}
}