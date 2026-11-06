import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { DEFAULT_BRANCH_NAME } from "../src/lib/branch";

async function main() {
  const prisma = new PrismaClient();
  const username = process.env.SEED_SECRETARY_USER || "zhishu9";
  const password = process.env.SEED_SECRETARY_PASS || "zhishu123";
  const displayName = process.env.SEED_SECRETARY_NAME || "第九党支部支书";

  const account = await prisma.secretaryAccount.upsert({
    where: { username },
    create: {
      username,
      passwordHash: hashPassword(password),
      displayName,
      branchName: DEFAULT_BRANCH_NAME,
      isActive: true,
    },
    update: {
      passwordHash: hashPassword(password),
      displayName,
      branchName: DEFAULT_BRANCH_NAME,
      isActive: true,
    },
  });

  console.log(
    JSON.stringify({
      id: account.id,
      username,
      password,
      branchName: account.branchName,
    })
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
