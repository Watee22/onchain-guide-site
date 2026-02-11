// Simulation State
const INITIAL_BALANCES = {
    my: {
        "usdt-eth": 1000.0,
        "usdt-trc": 1000.0,
        "usdt-sol": 1000.0,
        "usdt-base": 0.0, // New: Base network
        "eth": 1.0,
        "trx": 0.0,      // Need to buy gas
        "sol": 0.0,      // Need to buy gas
        "eth-base": 0.0  // Need to buy gas
    },
    friend: {
        "usdt-eth": 0.0,
        "usdt-trc": 0.0,
        "usdt-sol": 0.0,
        "usdt-base": 0.0,
        "eth": 0.5,
        "trx": 50.0,
        "sol": 1.0,
        "eth-base": 0.1
    }
};

let state = JSON.parse(JSON.stringify(INITIAL_BALANCES));

// Configuration
const GAS_COSTS = {
    ethereum: { asset: "eth", cost: 0.005 },
    tron:     { asset: "trx", cost: 13.5 },
    solana:   { asset: "sol", cost: 0.00005 },
    base:     { asset: "eth-base", cost: 0.0001 }
};

const BRIDGE_FEE_USDT = 1.0;
const GAS_PRICES_USDT = {
    ethereum: 2500, // 1 ETH = 2500 USDT
    tron: 0.15,     // 1 TRX = 0.15 USDT
    solana: 150,    // 1 SOL = 150 USDT
    base: 2500      // 1 ETH = 2500 USDT
};

// DOM Elements
const ui = {
    myBalanceList: document.getElementById('myBalanceList'),
    friendBalanceList: document.getElementById('friendBalanceList'),
    createWalletBtn: document.getElementById('createWalletBtn'),
    // Gas Station
    gasNetwork: document.getElementById('gasNetwork'),
    gasCostUsdt: document.getElementById('gasCostUsdt'),
    buyGasBtn: document.getElementById('buyGasBtn'),
    gasResult: document.getElementById('gasResult'),
    // Bridge
    bridgeFrom: document.getElementById('bridgeFromNet'),
    bridgeTo: document.getElementById('bridgeToNet'),
    bridgeAsset: document.getElementById('bridgeAsset'),
    bridgeAmount: document.getElementById('bridgeAmount'),
    bridgeBtn: document.getElementById('bridgeBtn'),
    bridgeResult: document.getElementById('bridgeResult'),
    // Transfer
    sendAsset: document.getElementById('sendAsset'),
    recvPerson: document.getElementById('recvPerson'),
    targetNetwork: document.getElementById('targetNetwork'),
    sendAmount: document.getElementById('sendAmount'),
    sendBtn: document.getElementById('sendBtn'),
    txResult: document.getElementById('txResult')
};

// Initialization
const mockMnemonic = "apple river house sleep car blue sky green grass bird fly sun";
const mockEthAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const mockTronAddress = "TX8...72j";
const mockSolAddress = "Hu9...2kL";

function renderBalances() {
    // My Balances
    ui.myBalanceList.innerHTML = `
        <li><strong>Ethereum:</strong> ${state.my["eth"].toFixed(4)} ETH / ${state.my["usdt-eth"].toFixed(2)} USDT</li>
        <li><strong>Tron:</strong> ${state.my["trx"].toFixed(2)} TRX / ${state.my["usdt-trc"].toFixed(2)} USDT</li>
        <li><strong>Solana:</strong> ${state.my["sol"].toFixed(4)} SOL / ${state.my["usdt-sol"].toFixed(2)} USDT</li>
        <li><strong>Base (L2):</strong> ${state.my["eth-base"].toFixed(4)} ETH / ${state.my["usdt-base"].toFixed(2)} USDT</li>
    `;
    
    // Friend Balances
    ui.friendBalanceList.innerHTML = `
        <li><strong>Ethereum:</strong> ${state.friend["usdt-eth"].toFixed(2)} USDT</li>
        <li><strong>Tron:</strong> ${state.friend["usdt-trc"].toFixed(2)} USDT</li>
        <li><strong>Solana:</strong> ${state.friend["usdt-sol"].toFixed(2)} USDT</li>
        <li><strong>Base:</strong> ${state.friend["usdt-base"].toFixed(2)} USDT</li>
    `;
}

renderBalances();

// --- Features ---

// 1. Reset Wallet
ui.createWalletBtn.addEventListener('click', () => {
    if(confirm("确定要重置所有模拟数据并生成新钱包吗？")) {
        // Reset State
        state = JSON.parse(JSON.stringify(INITIAL_BALANCES));
        
        // Show Details
        const detailsDiv = document.getElementById('walletDetails');
        const mnemonicDisp = document.getElementById('mnemonicDisplay');
        const ethDisp = document.getElementById('ethAddress');
        const tronDisp = document.getElementById('tronAddress');
        const solDisp = document.getElementById('solAddress');

        if(detailsDiv) {
            detailsDiv.classList.remove('hidden');
            mnemonicDisp.textContent = mockMnemonic;
            ethDisp.textContent = mockEthAddress;
            tronDisp.textContent = mockTronAddress;
            solDisp.textContent = mockSolAddress;
        }

        renderBalances();
        clearResults();
    }
});

// 2. Buy Gas Logic
ui.buyGasBtn.addEventListener('click', () => {
    const network = ui.gasNetwork.value;
    const costUsdt = parseFloat(ui.gasCostUsdt.value);
    const payAsset = "usdt-eth"; // Assume paying with ETH USDT for simplicity, or just "fiat"
    
    // In this sim, we allow buying gas using "Fiat" (Magic) or assume they pay with existing USDT if available.
    // Let's assume they swap USDT-ETH for Gas on other chains (CEX simulation).
    
    if (costUsdt <= 0) return showError(ui.gasResult, "金额无效");

    // Calculate received gas
    const price = GAS_PRICES_USDT[network];
    const receivedAmount = costUsdt / price;
    
    // Deduct USDT from somewhere? For simplicity, let's say this is a "Fiat Deposit" or CEX swap.
    // If we want to be strict, we check balances. Let's deduct from USDT-TRC or USDT-ETH.
    // Let's just Add Gas (Simulate "Bought from Exchange").
    
    let targetAsset = "";
    if (network === 'ethereum') targetAsset = "eth";
    if (network === 'tron') targetAsset = "trx";
    if (network === 'solana') targetAsset = "sol";
    if (network === 'base') targetAsset = "eth-base";

    state.my[targetAsset] += receivedAmount;
    renderBalances();
    showSuccess(ui.gasResult, `✅ 购买成功！<br>花费 $${costUsdt}，获得 ${receivedAmount.toFixed(4)} ${targetAsset.toUpperCase()}。<br>现在你有足够的 Gas 费了。`);
});

// 3. Bridge Logic
ui.bridgeBtn.addEventListener('click', () => {
    const fromNet = ui.bridgeFrom.value;
    const toNet = ui.bridgeTo.value;
    const assetType = ui.bridgeAsset.value;
    const amount = parseFloat(ui.bridgeAmount.value);

    resetResult(ui.bridgeResult);

    if (fromNet === toNet) return showError(ui.bridgeResult, "源网络和目标网络不能相同！");
    if (amount <= 0) return showError(ui.bridgeResult, "请输入有效金额");

    // Determine Asset Keys
    // e.g. usdt-eth, usdt-trc
    const fromAssetKey = `${assetType}-${fromNet === 'ethereum' ? 'eth' : (fromNet === 'tron' ? 'trc' : (fromNet === 'base' ? 'base' : 'sol'))}`;
    const toAssetKey = `${assetType}-${toNet === 'ethereum' ? 'eth' : (toNet === 'tron' ? 'trc' : (toNet === 'base' ? 'base' : 'sol'))}`;

    // Check Balance
    if (state.my[fromAssetKey] < amount) return showError(ui.bridgeResult, "余额不足！无法跨链。");

    // Check Gas on Source Chain
    const gasInfo = GAS_COSTS[fromNet];
    if (state.my[gasInfo.asset] < gasInfo.cost) {
        return showError(ui.bridgeResult, `❌ <strong>Gas 不足！</strong><br>
        在 ${fromNet.toUpperCase()} 网络发起跨链交易需要支付 Gas 费。<br>
        你需要至少 ${gasInfo.cost} ${gasInfo.asset.toUpperCase()}。<br>
        请先去“Gas 加油站”购买。`);
    }

    // Execute Bridge
    state.my[fromAssetKey] -= amount;
    state.my[gasInfo.asset] -= gasInfo.cost; // Deduct Gas
    
    // Deduct Bridge Fee (e.g. 1 USDT taken from the transfer amount or separate?)
    // Usually bridges take fee from the amount.
    const finalAmount = amount - BRIDGE_FEE_USDT;
    
    if (finalAmount <= 0) return showError(ui.bridgeResult, "金额太小，不足以支付跨链手续费 (1 USDT)。");

    state.my[toAssetKey] += finalAmount;

    renderBalances();
    showSuccess(ui.bridgeResult, `✅ <strong>跨链成功！</strong><br>
    发送: ${amount} ${assetType.toUpperCase()} (${fromNet})<br>
    接收: ${finalAmount.toFixed(2)} ${assetType.toUpperCase()} (${toNet})<br>
    Gas 消耗: ${gasInfo.cost} ${gasInfo.asset.toUpperCase()}<br>
    跨链费: ${BRIDGE_FEE_USDT} USDT`);
});

// 4. Transfer Logic (P2P)
ui.sendBtn.addEventListener('click', () => {
    const assetKey = ui.sendAsset.value;
    const targetNet = ui.targetNetwork.value;
    const recipient = ui.recvPerson.value;
    const amount = parseFloat(ui.sendAmount.value);

    resetResult(ui.txResult);

    // 1. Identify Source Network & Native Asset
    let sourceNet = "";
    if (assetKey.includes("eth")) sourceNet = "ethereum";
    if (assetKey.includes("trc") || assetKey.includes("trx")) sourceNet = "tron";
    if (assetKey.includes("sol")) sourceNet = "solana";
    if (assetKey.includes("base")) sourceNet = "base";

    // 2. Validate Network Match (Isolation)
    if (sourceNet !== targetNet) {
        return showError(ui.txResult, `❌ <strong>严重错误：网络不匹配！</strong><br>
        你试图将 <strong>${sourceNet.toUpperCase()}</strong> 上的资产发送到 <strong>${targetNet.toUpperCase()}</strong> 网络。<br>
        <br>
        <strong>后果：</strong> 资产将永久丢失！<br>
        <strong>正确做法：</strong> 先使用“跨链桥”将资产迁移到目标网络。`);
    }

    // 3. Check Balance
    if (state.my[assetKey] < amount) return showError(ui.txResult, "余额不足！");

    // 4. Check Gas
    const gasInfo = GAS_COSTS[sourceNet];
    // If sending the gas token itself (e.g. sending ETH), need balance > amount + gas
    let gasNeeded = gasInfo.cost;
    let totalDeduct = amount;
    
    if (assetKey === gasInfo.asset) {
        if (state.my[assetKey] < amount + gasNeeded) {
             return showError(ui.txResult, `❌ <strong>Gas 不足！</strong><br>你需要保留 ${gasNeeded} ${gasInfo.asset.toUpperCase()} 作为手续费。`);
        }
    } else {
        if (state.my[gasInfo.asset] < gasNeeded) {
            return showError(ui.txResult, `❌ <strong>Gas 不足！</strong><br>
            发送代币需要支付 Gas 费。<br>
            当前网络 (${sourceNet}) 需要 ${gasNeeded} ${gasInfo.asset.toUpperCase()}。<br>
            请先去“Gas 加油站”购买。`);
        }
    }

    // Execute Transfer
    state.my[assetKey] -= amount;
    state.my[gasInfo.asset] -= gasNeeded;

    // Update Friend if applicable
    if (recipient === 'friend') {
        // Map assetKey to friend's key (same keys)
        if (state.friend[assetKey] !== undefined) {
            state.friend[assetKey] += amount;
        }
    }

    renderBalances();
    showSuccess(ui.txResult, `✅ <strong>转账成功！</strong><br>
    发送: ${amount} (${sourceNet})<br>
    Gas 消耗: ${gasNeeded} ${gasInfo.asset.toUpperCase()}<br>
    接收方: ${recipient === 'friend' ? '朋友 (已到账)' : '其他地址'}`);
});


// Utils
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
function clearResults() {
    resetResult(ui.gasResult);
    resetResult(ui.bridgeResult);
    resetResult(ui.txResult);
}
