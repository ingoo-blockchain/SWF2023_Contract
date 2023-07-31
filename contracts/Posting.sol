// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract Posting is Ownable {
    mapping(string => string) private posts;

    // Emitted when data stored
    event PostStored(string key);

    // Stores a new value in the contract
    function store(string memory key, string memory ipfsUrl) public onlyOwner {
        posts[key] = ipfsUrl;
        emit PostStored(key);
    }

    // Reads the last stored value
    function retrieve(string memory key) public view returns (string memory) {
        return posts[key];
    }
}
