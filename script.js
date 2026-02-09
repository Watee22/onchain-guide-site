// Simulation Logic

// Mock Data
const mockMnemonic = "apple river house sleep car blue sky green grass bird fly sun";
const mockEthAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const mockTronAddress = "TX8...72j (Tron Address)";
const mockSolAddress = "Hu9...2kL (Solana Address)";

let balances = {
    "usdt-trc": 1000.0,
    "usdt-sol": 1000.0,
    "eth": 1.0,
    "sol": 10.0
};

// DOM Elements
const createWalletBtn = document.getElementById('createWalletBtn');
const walletResult = document.getElementById('walletResult');
const mnemonicDisplay = document.getElementById('mnemonicDisplay');
const ethAddressDisplay = document.getElementById('ethAddress');
const tronAddressDisplay = document.getElementById('tronAddress');
const solAddressDisplay = document.getElementById('solAddress');

const sendBtn = document.getElementById('sendBtn');
const txResult = document.getElementById('txResult');
const balanceSpans = {
    "usdt-trc": document.getElementById('bal-usdt-trc'),
    "usdt-sol": document.getElementById('bal-usdt-sol'),
    "eth": document.getElementById('bal-eth'),
    "sol": document.getElementById('bal-sol')
};

// 1. Wallet Creation
createWalletBtn.addEventListener('click', () => {
    // Simulate loading
    createWalletBtn.textContent = "生成中...";
    createWalletBtn.disabled = true;

    setTimeout(() => {
        mnemonicDisplay.textContent = mockMnemonic;
        ethAddressDisplay.textContent = mockEthAddress;
        tronAddressDisplay.textContent = mockTronAddress;
        solAddressDisplay.textContent = mockSolAddress;
        
        walletResult.classList.remove('hidden');
        createWalletBtn.textContent = "生成新钱包";
        createWalletBtn.disabled = false;
        
        // Scroll to result
        walletResult.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
});

// 2. Transaction Logic
sendBtn.addEventListener('click', () => {
    const asset = document.getElementById('sendAsset').value;
    const targetNetwork = document.getElementById('targetNetwork').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);

    txResult.className = 'result-box'; // reset classes
    txResult.innerHTML = '';

    // Validation 1: Amount
    if (isNaN(amount) || amount <= 0) {
        showError("请输入有效的金额！");
        return;
    }
    if (amount > balances[asset]) {
        showError("余额不足！");
        return;
    }

    // Validation 2: Cross-chain Logic (The Core Lesson)
    // Map assets to their native networks
    const assetNetworkMap = {
        "usdt-trc": "tron",
        "usdt-sol": "solana",
        "eth": "ethereum",
        "sol": "solana"
    };

    const nativeNet = assetNetworkMap[asset];

    if (nativeNet !== targetNetwork) {
        // CROSS-CHAIN ERROR
        let assetName = asset.toUpperCase();
        if(asset === "usdt-trc") assetName = "USDT (TRC20)";
        if(asset === "usdt-sol") assetName = "USDT (Solana)";

        showError(`❌ <strong>转账失败！严重的链上错误！</strong><br><br>
        你试图将 <strong>${assetName}</strong> 直接发送到 <strong>${targetNetwork.toUpperCase()}</strong> 网络。<br>
        这是不可能的！<br>
        - TRC20 代币只能转给 Tron 地址。<br>
        - Solana 代币只能转给 Solana 地址。<br>
        <br>
        如果在真实世界这样操作，<strong>你的资产将会永久丢失！</strong><br>
        请使用跨链桥 (Bridge) 或交易所进行跨链。`);
        return;
    }

    // Success
    balances[asset] -= amount;
    updateBalances();
    showSuccess(`✅ <strong>转账成功！</strong><br>
    成功发送 ${amount} ${asset.toUpperCase().replace("-", " ")} 到 ${targetNetwork.toUpperCase()} 网络。<br>
    当前余额已更新。`);
});

function showError(msg) {
    txResult.classList.remove('hidden');
    txResult.classList.add('error');
    txResult.innerHTML = msg;
}

function showSuccess(msg) {
    txResult.classList.remove('hidden');
    txResult.classList.add('success');
    txResult.innerHTML = msg;
}

function updateBalances() {
    for (let key in balances) {
        if(balanceSpans[key]) {
            balanceSpans[key].textContent = balances[key].toFixed(4);
        }
    }
}
