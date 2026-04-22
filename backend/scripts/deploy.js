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
  const existingEnv = fs.existsSync(frontendEnvPath)
    ? fs.readFileSync(frontendEnvPath, "utf8")
    : "";
  const envMap = new Map(
    existingEnv
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );

  envMap.set("NEXT_PUBLIC_CROWDFUNDING_ADDRESS", crowdfunding.address);
  envMap.set("NEXT_PUBLIC_DEPLOYED_CHAIN_ID", network.chainId.toString());

  if (network.chainId === 31337) {
    envMap.set("NEXT_PUBLIC_LOCAL_CROWDFUNDING_ADDRESS", crowdfunding.address);
  }

  const envContents = Array.from(envMap)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
    .concat("\n");

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
