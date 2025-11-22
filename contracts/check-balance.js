const ethers = require('ethers');

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/3Az_0T41H83lT_m8snNzK');
  const wallet = new ethers.Wallet('85d1788c5fe680d42972bfd29bb7a62d3184fb71872a631e638622c76f84cc88', provider);
  
  const address = await wallet.getAddress();
  const balance = await provider.getBalance(address);
  
  console.log('Wallet Address:', address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
}

checkBalance();
