const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying LandRegistry...");
  
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  
  console.log(`LandRegistry deployed to: ${address}`);
  
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Saved deployment info to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
