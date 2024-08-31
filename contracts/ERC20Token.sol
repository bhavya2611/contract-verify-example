// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ERC20Token is Initializable, ERC20Upgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) public initializer {
        __ERC20_init(name, symbol);
        _mint(msg.sender, totalSupply);
    }
}
