// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./ERC20Token.sol";

contract TokenFactory {
    address public tokenImplementation;
    ProxyAdmin public proxyAdmin;

    constructor() {
        tokenImplementation = address(new ERC20Token());
        proxyAdmin = new ProxyAdmin(msg.sender);
    }

    function deployToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) public returns (address) {
        bytes memory initializeData = abi.encodeWithSelector(
            ERC20Token(address(0)).initialize.selector,
            name,
            symbol,
            totalSupply
        );

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            tokenImplementation,
            address(proxyAdmin),
            initializeData
        );

        return address(proxy);
    }
}
