const ethers = require("ethers");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Read contract sources
const ERC20TokenContract = fs.readFileSync(
  path.join(__dirname, "ERC20Token.sol"),
  "utf8"
);
const TokenFactoryContract = fs.readFileSync(
  path.join(__dirname, "TokenFactory.sol"),
  "utf8"
);

// OpenZeppelin contracts (you'll need to install @openzeppelin/contracts and @openzeppelin/contracts-upgradeable)
function readOpenzeppelinContract(contractPath) {
  return fs.readFileSync(
    path.join(__dirname, "node_modules", contractPath),
    "utf8"
  );
}

const openzeppelinContracts = {
  "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol":
    readOpenzeppelinContract(
      "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol"
    ),
  "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol":
    readOpenzeppelinContract(
      "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol"
    ),
  "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol":
    readOpenzeppelinContract(
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol"
    ),
  "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol":
    readOpenzeppelinContract(
      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol"
    )
  // Add other required OpenZeppelin contracts here
};

const sources = {
  "ERC20Token.sol": { content: ERC20TokenContract },
  "TokenFactory.sol": { content: TokenFactoryContract },
  ...Object.fromEntries(
    Object.entries(openzeppelinContracts).map(([key, value]) => [
      key,
      { content: value }
    ])
  )
};

async function verifyContract(
  address,
  contractName,
  constructorArguments = ""
) {
  const verificationData = {
    apikey: "YOUR_ETHERSCAN_API_KEY", // Replace with your Etherscan API key
    module: "contract",
    action: "verifysourcecode",
    contractaddress: address,
    sourceCode: JSON.stringify({
      language: "Solidity",
      sources: sources,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }),
    codeformat: "solidity-standard-json-input",
    contractname: contractName,
    compilerversion: "v0.8.9+commit.e5eed63a", // Update to match your Solidity version
    constructorArguments: constructorArguments
  };

  try {
    const response = await axios.post(
      "https://api.etherscan.io/api",
      verificationData,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );
    console.log(`Verification response for ${contractName}:`, response.data);
  } catch (error) {
    console.error(`Error verifying ${contractName}:`, error);
  }
}

async function verifyAll(factoryAddress, tokenAddress) {
  // Verify Factory
  await verifyContract(factoryAddress, "TokenFactory.sol:TokenFactory");

  // Verify Token (Proxy)
  const ABI = [
    "function initialize(string memory name, string memory symbol, uint256 totalSupply) public"
  ];
  const iface = new ethers.utils.Interface(ABI);
  const encodedInitialize = iface.encodeFunctionData("initialize", [
    "MyToken",
    "MTK",
    ethers.utils.parseEther("1000000")
  ]);

  const proxyConstructorArgs = ethers.utils.defaultAbiCoder
    .encode(
      ["address", "address", "bytes"],
      [
        "0x...", // implementation address (you need to get this from the factory deployment)
        "0x...", // admin address (ProxyAdmin address, you need to get this from the factory deployment)
        encodedInitialize
      ]
    )
    .slice(2); // remove '0x' prefix

  await verifyContract(
    tokenAddress,
    "TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
    proxyConstructorArgs
  );
}

// Usage
verifyAll("FACTORY_ADDRESS", "TOKEN_ADDRESS");
