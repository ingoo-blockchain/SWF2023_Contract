// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol';

contract GovernanceToken is ERC20Votes {
    uint256 public s_maxSupply; // 10,000,000

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        _mint(msg.sender, _totalSupply);
        s_maxSupply = _totalSupply;
    }

    // functions below are overrides required by solidty

    // _afterTokenTransfer() : want to make sure that the snapshots are updated
    // mkae sure we always know how many tokens people have at different checkpoints
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._burn(account, amount);
    }
}
