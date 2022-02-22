//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Whitelist {

    // Max number of address that can be whitelisted    
    uint8 public maxWhitelistedAddresses;

    // Creates a mapping of whitelisted Addresses
    // if an address is whitelisted this would be set to true, it is false by default for all other addresses.
    mapping(address => bool) public whitelistedAddresses;

    // numAddressesWhitelisted would be used to keep track of how many addresses have been whitelisted
    uint8 public numAddressesWhitelisted;

    // Setting the max number of whitelisted addresses
    // User will put the value of the time of deployment
    constructor(uint8 _maxWhitelistedAddresses){
        maxWhitelistedAddresses = _maxWhitelistedAddresses;
    }

    // this function adds the address of the sender to the whitelist
    function addAddressToWhitelist() public {
        // Checks if the user has already been whitelisted
        require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted");
        // checks if the numAddressesWhitelisted < maxWhitelistedAddresses, if not then throw this error
        require(numAddressesWhitelisted < maxWhitelistedAddresses, "Max amount of addresses whitelisted");
        // Adds the address which called the function to the whitelistedAddresses array
        whitelistedAddresses[msg.sender] = true;
        // increase the number of whitelisted addresses
        numAddressesWhitelisted += 1;
    }
}