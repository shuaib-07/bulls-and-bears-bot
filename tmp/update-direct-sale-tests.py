from pathlib import Path

p = Path("tests/postgres-transactions.cjs")
s = p.read_text(encoding="utf-8")
s = s.replace("pin:'9988'", "pin:process.env.ADMIN_PIN || '9988'")
start = s.index("    assert.equal((await trade(request({simulationId,action:'SELL',teamId:winner.id")
end = s.index("    const swapResponses =", start)
s = s[:start] + '''    assert.equal((await trade(request({simulationId,action:'SELL',teamId:winner.id,targetTeamId:buyer.id,ticker:'AAPL',quantity:1,pricePerShare:12.34}))).status,403);
    assert.equal((await trade(request({simulationId,action:'ACCEPT_DIRECT_SELL',teamId:buyer.id,offerId:'old-offer'}))).status,403);
    assert.equal((await command('SET_NEGOTIATED_PRICES',{enabled:true})).status,403);
    assert.equal((await trade(request({simulationId,action:'BUY',teamId:buyer.id,ticker:'MSFT',quantity:2}))).status,200);
    const proposed = await swap(request({simulationId,action:'PROPOSE',teamId:winner.id,senderId:winner.id,receiverId:buyer.id,giveTicker:'AAPL',giveQty:1,receiveTicker:'MSFT',receiveQty:1}));
    assert.equal(proposed.status,200);
    const swapId = (await proposed.json()).swap.id;
''' + s[end:]
anchor = "    await command('SET_MARKET_SELL_LOCK',{enabled:false});"
s = s.replace(anchor, '''    assert.equal((await trade(request({simulationId,action:'SELL',teamId:buyer.id,targetTeamId:'MARKET_POOL',ticker:'AAPL',quantity:1}))).status,403);
    const second = await swap(request({simulationId,action:'PROPOSE',teamId:winner.id,senderId:winner.id,receiverId:buyer.id,giveTicker:'AAPL',giveQty:1,receiveTicker:'MSFT',receiveQty:1}));
    assert.equal(second.status,200);
    assert.equal((await swap(request({simulationId,action:'ACCEPT',teamId:buyer.id,swapId:(await second.json()).swap.id}))).status,200);
''')
s = s.replace("targetTeamId:'MARKET_POOL',ticker:'MSFT',quantity:1", "targetTeamId:'MARKET_POOL',ticker:'AAPL',quantity:1")
s = s.replace('negotiated sales', 'direct-sale rejection, two-swap unlock')
p.write_text(s, encoding="utf-8")
print("Updated the isolated Neon integration test for swaps-only peer trading.")
