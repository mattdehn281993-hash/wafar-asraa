import { monthOptions, type Member, type Purchase } from "../domain/model";
export const demoMembers: Member[] = [
  { id: "mona", name: "Mona", username: "mona", role: "owner", status: "active" },
  { id: "ahmed", name: "Ahmed", username: "ahmed", role: "member", status: "active" },
  { id: "youssef", name: "Youssef", username: "youssef", role: "member", status: "active" },
];
export function seedPurchases(): Purchase[] {
  return monthOptions().flatMap((month, index) => [
    { id: `${month}-1`, date: `${month}-01`, memberId: "mona", store: "Al Nour", category: "groceries", amount: 168000 + index * 1000, saving: 24000, source: "sample" as const },
    { id: `${month}-2`, date: `${month}-02`, memberId: "ahmed", store: "Fresh Corner", category: "meat", amount: 74000 + index * 500, saving: 12000, source: "sample" as const },
    { id: `${month}-3`, date: `${month}-03`, memberId: "mona", store: "Baraka", category: "home", amount: 46000, saving: 8000, source: "sample" as const },
    { id: `${month}-4`, date: `${month}-04`, memberId: "youssef", store: "Masr Hyper", category: "snacks", amount: 36000, saving: 6000, source: "sample" as const },
  ]);
}
