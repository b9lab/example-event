contract Incrementor {
	uint value;

	event LogValue(uint value);

	function Incrementor() {
		LogValue(0);
	}

	function increaseValue() {
		LogValue(++value);
	}
}