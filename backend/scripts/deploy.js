const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  // We get the contract to deploy
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();

  await crowdfunding.deployed();

  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env.local");
  const network = await hre.ethers.provider.getNetwork();
  const envContents = [
    `NEXT_PUBLIC_CROWDFUNDING_ADDRESS=${crowdfunding.address}`,
    `NEXT_PUBLIC_LOCAL_CROWDFUNDING_ADDRESS=${crowdfunding.address}`,
    `NEXT_PUBLIC_DEPLOYED_CHAIN_ID=${network.chainId}`,
    "",
  ].join("\n");
  fs.writeFileSync(frontendEnvPath, envContents, "utf8");

  console.log("Crowdfunding deployed to:", crowdfunding.address);
  console.log("Frontend env updated:", frontendEnvPath);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
