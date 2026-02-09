// Simulation Logic

// Mock Data for User Wallet
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

// P2P Elements
const sendBtn = document.getElementById('sendBtn');
const txResult = document.getElementById('txResult');
const recvAddressInput = document.getElementById('recvAddress');
const targetNetworkSelect = document.getElementById('targetNetwork');

// Merchant Elements
const merchantPayBtn = document.getElementById('merchantPayBtn');
const merchantResult = document.getElementById('merchantResult');
const merchantPayAmountInput = document.getElementById('merchantPayAmount');
const merchantPayNetworkSelect = document.getElementById('merchantPayNetwork');

const balanceSpans = {
    "usdt-trc": document.getElementById('bal-usdt-trc'),
    "usdt-sol": document.getElementById('bal-usdt-sol'),
    "eth": document.getElementById('bal-eth'),
    "sol": document.getElementById('bal-sol')
};

// 1. Wallet Creation
createWalletBtn.addEventListener('click', () => {
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
        walletResult.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
});

// Quick Fill Logic
document.querySelectorAll('.quick-fill').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        recvAddressInput.value = e.target.dataset.addr;
        targetNetworkSelect.value = e.target.dataset.net;
    });
});

// 2. P2P Transaction Logic
sendBtn.addEventListener('click', () => {
    const asset = document.getElementById('sendAsset').value;
    const targetNetwork = targetNetworkSelect.value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const recvAddr = recvAddressInput.value.trim();

    resetResult(txResult);

    // Validation
    if (isNaN(amount) || amount <= 0) {
        showError(txResult, "请输入有效的金额！");
        return;
    }
    if (amount > balances[asset]) {
        showError(txResult, "余额不足！");
        return;
    }
    if (!recvAddr) {
        showError(txResult, "请输入接收方地址！");
        return;
    }

    // Cross-chain Logic
    const assetNetworkMap = {
        "usdt-trc": "tron",
        "usdt-sol": "solana",
        "eth": "ethereum",
        "sol": "solana"
    };
    const nativeNet = assetNetworkMap[asset];

    if (nativeNet !== targetNetwork) {
        let assetName = asset.toUpperCase();
        if(asset === "usdt-trc") assetName = "USDT (TRC20)";
        if(asset === "usdt-sol") assetName = "USDT (Solana)";

        showError(txResult, `❌ <strong>转账失败！严重的链上错误！</strong><br><br>
        你试图将 <strong>${assetName}</strong> (原生网络: ${nativeNet}) 发送到 <strong>${targetNetwork.toUpperCase()}</strong> 网络。<br>
        这是不可能的！<br>
        如果在真实世界这样操作，<strong>你的资产将会永久丢失！</strong><br>
        请确保发币网络与接收网络一致。`);
        return;
    }

    // Success
    balances[asset] -= amount;
    updateBalances();
    showSuccess(txResult, `✅ <strong>转账成功！</strong><br>
    成功发送 ${amount} ${asset.toUpperCase().replace("-", " ")} 给朋友。<br>
    当前余额已更新。`);
});

// 3. Merchant Payment Logic
merchantPayBtn.addEventListener('click', () => {
    const amount = parseFloat(merchantPayAmountInput.value);
    const network = merchantPayNetworkSelect.value;
    const requiredAmount = 50.0;
    const requiredNetwork = "tron";
    const assetKey = "usdt-trc"; // User pays with TRC20 USDT

    resetResult(merchantResult);

    // Basic Validation
    if (isNaN(amount) || amount <= 0) {
        showError(merchantResult, "请输入有效金额");
        return;
    }
    if (balances[assetKey] < amount) {
        showError(merchantResult, "钱包余额不足 (USDT-TRC20)！");
        return;
    }

    // Network Check
    if (network !== requiredNetwork) {
        showError(merchantResult, `❌ <strong>支付失败：网络错误！</strong><br>
        商家只接受 <strong>TRC20</strong> 网络转账。<br>
        你选择了 <strong>${network.toUpperCase()}</strong>。<br>
        如果在真实世界，资金可能丢失，商家也不会收到款项。`);
        return;
    }

    // Amount Check
    if (amount < requiredAmount) {
        balances[assetKey] -= amount; // Deduct anyway
        updateBalances();
        showError(merchantResult, `⚠️ <strong>支付不足 (Underpaid)！</strong><br>
        订单需要 ${requiredAmount} USDT，你只支付了 ${amount} USDT。<br>
        <br>
        <strong>后果：</strong><br>
        1. 商家系统无法自动确认订单。<br>
        2. 你需要联系客服补款（非常麻烦）。<br>
        3. 交易手续费白白浪费了。<br>
        (资金已从你钱包扣除)`);
        return;
    }

    if (amount > requiredAmount) {
        balances[assetKey] -= amount; // Deduct anyway
        updateBalances();
        showSuccess(merchantResult, `✅ <strong>支付成功，但... (Overpaid)</strong><br>
        订单确认成功！但是...<br>
        你支付了 ${amount} USDT，比订单多了 ${(amount - requiredAmount).toFixed(2)} USDT。<br>
        <br>
        <strong>后果：</strong><br>
        多付的钱通常很难退回，或者需要支付额外的手续费才能退款。<br>
        下次请务必<strong>精确输入金额</strong>！`);
        return;
    }

    // Exact Match
    balances[assetKey] -= amount;
    updateBalances();
    showSuccess(merchantResult, `✅ <strong>支付完美成功！</strong><br>
    金额精确 (50.0 USDT)，网络正确 (TRC20)。<br>
    订单已立即确认，发货中...`);
});

// Utilities
function resetResult(el) {
    el.className = 'result-box';
    el.innerHTML = '';
    el.classList.add('hidden');
}

function showError(el, msg) {
    el.classList.remove('hidden');
    el.classList.add('error');
    el.innerHTML = msg;
}

function showSuccess(el, msg) {
    el.classList.remove('hidden');
    el.classList.add('success');
    el.innerHTML = msg;
}

function updateBalances() {
    for (let key in balances) {
        if(balanceSpans[key]) {
            balanceSpans[key].textContent = balances[key].toFixed(4);
        }
    }
}
