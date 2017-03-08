pragma solidity ^0.4.6;

contract Sandbox {
    function retArr() 
    	public
    	constant
    	returns (byte[3][10] ret) {
        ret[0][0] = byte(1);
        ret[1][0] = byte(2);
        ret[0][1] = byte(3);
        // ret[2][0] = byte(3);
        // ret[3][0] = byte(4);
        ret[2][2] = byte(9);
    }
}
