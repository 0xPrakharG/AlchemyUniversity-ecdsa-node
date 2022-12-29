const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "b83ab85e1fbe71c7e7643df5de9f7cc6be4f96da": 100,
  "c42da13bc0dcb20f3fb7af2433dfe10641721501": 50,
  "4797dfec2b8a68b653344cdd803b6f6df8c5598c": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, sign, recoveryBit } = req.body;
  const message = {sender, amount,recipient};
  const messageHash = hashMessage(JSON.stringify(message));
  const recovered = secp.recoverPublicKey(messageHash, hexToBytes(sign), recoveryBit);

  const addressOfSign = toHex(addressFromPublicKey(recovered));
  console.log('addressOfSign:',addressOfSign);

  setInitialBalance(sender);
  setInitialBalance(recipient);
  if(sender!==addressOfSign){
    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      console.log("Public Key Verified");
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
function hashMessage(message) {
  const bytes = utf8ToBytes(message);
  return keccak256(bytes);
}
function addressFromPublicKey(publicKey){
  const addrBytes = publicKey.slice(1);
  const hash = keccak256(addrBytes);
  return hash.slice(-20);
}