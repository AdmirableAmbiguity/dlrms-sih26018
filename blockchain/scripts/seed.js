const hre = require("hardhat");
const fs = require("fs");

async function main() {
  if (!fs.existsSync("deployment.json")) {
    console.error("Please run deploy.js first!");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync("deployment.json"));
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = LandRegistry.attach(deployment.address);
  
  const [deployer, user1, user2, user3] = await hre.ethers.getSigners();
  
  console.log("Seeding data...");
  
  // 1. Lock a record
  const canonicalId1 = "UP/GZB/MOD/2024/001";
  const hash1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("demo_record_data_1"));
  let tx = await registry.lockRecord(canonicalId1, hash1);
  await tx.wait();
  console.log(`Locked record: ${canonicalId1}`);
  
  // 2. Record transfers
  tx = await registry.recordTransfer(
    canonicalId1,
    user1.address,
    user2.address,
    hre.ethers.parseEther("1.5"),
    Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    "SALE"
  );
  await tx.wait();
  console.log("Recorded transfer 1");
  
  // 3. Circular transfer (Fraud demo)
  const canonicalId2 = "UP/GZB/LONI/2024/005";
  const hash2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("demo_record_data_2"));
  
  await (await registry.lockRecord(canonicalId2, hash2)).wait();
  
  await (await registry.recordTransfer(
    canonicalId2,
    user1.address,
    user2.address,
    hre.ethers.parseEther("2.0"),
    Math.floor(Date.now() / 1000) - 86400 * 10,
    "SALE"
  )).wait();
  
  await (await registry.recordTransfer(
    canonicalId2,
    user2.address,
    user3.address,
    hre.ethers.parseEther("2.5"),
    Math.floor(Date.now() / 1000) - 86400 * 5,
    "SALE"
  )).wait();
  
  await (await registry.recordTransfer(
    canonicalId2,
    user3.address,
    user1.address, // Circular!
    hre.ethers.parseEther("3.0"),
    Math.floor(Date.now() / 1000) - 86400 * 1,
    "SALE"
  )).wait();
  console.log(`Recorded circular transfers for ${canonicalId2}`);
  
  console.log("Seed complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
