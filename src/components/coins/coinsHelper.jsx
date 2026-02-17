import { base44 } from "@/api/base44Client";

export async function getWallet(userEmail) {
  const wallets = await base44.entities.CoinWallet.filter({ user_email: userEmail });
  if (wallets.length > 0) return wallets[0];
  const wallet = await base44.entities.CoinWallet.create({ user_email: userEmail, balance: 100 });
  await base44.entities.CoinTransaction.create({
    user_email: userEmail, amount: 100, type: "signup_bonus", description: "Welcome bonus! 🎉",
  });
  return wallet;
}

export async function getBalance(userEmail) {
  const wallet = await getWallet(userEmail);
  return wallet?.balance || 0;
}

export async function addCoins(userEmail, amount, type, description, refId = "") {
  const wallet = await getWallet(userEmail);
  const newBalance = Math.max(0, (wallet.balance || 0) + amount);
  await base44.entities.CoinWallet.update(wallet.id, { balance: newBalance });
  await base44.entities.CoinTransaction.create({
    user_email: userEmail, amount, type, description, ref_id: refId,
  });
  return newBalance;
}

export async function claimDailyCheckin(userEmail) {
  const today = new Date().toDateString();
  const txns = await base44.entities.CoinTransaction.filter({ user_email: userEmail, type: "daily_checkin" }, "-created_date", 1);
  if (txns.length > 0 && new Date(txns[0].created_date).toDateString() === today) {
    return { success: false, message: "Already claimed today" };
  }
  const balance = await addCoins(userEmail, 10, "daily_checkin", "Daily check-in ✅");
  return { success: true, balance };
}